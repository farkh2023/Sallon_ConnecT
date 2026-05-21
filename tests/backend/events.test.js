'use strict';

const http = require('http');
const request = require('supertest');
const { app } = require('../../server');
const serverEventBus = require('../../server/src/services/serverEventBus');
const { expectNoSensitiveLeak } = require('../helpers/sensitive');

/* -----------------------------------------------
   Helpers
----------------------------------------------- */
function startTestServer() {
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

function sseRequest(port) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const req = http.get(
      `http://localhost:${port}/api/events/stream`,
      { headers: { Accept: 'text/event-stream' } },
      (res) => {
        resolve({ res, chunks, req });
        res.on('data', (chunk) => chunks.push(chunk.toString()));
      }
    );
    req.on('error', reject);
  });
}

/* -----------------------------------------------
   serverEventBus — tests unitaires
----------------------------------------------- */
describe('serverEventBus — subscribe / unsubscribe', () => {
  afterEach(() => {
    // Clean up any test clients
    const count = serverEventBus.getClientCount();
    if (count > 0) {
      // Access internal map through unsubscribe calls
      for (let i = 1; i <= 100; i++) serverEventBus.unsubscribe(i);
    }
  });

  it('subscribe enregistre un client et retourne un id', () => {
    const fakeRes = { write: jest.fn() };
    const id = serverEventBus.subscribe(fakeRes);
    expect(typeof id).toBe('number');
    expect(id).toBeGreaterThan(0);
    serverEventBus.unsubscribe(id);
  });

  it('unsubscribe supprime le client', () => {
    const fakeRes = { write: jest.fn() };
    const id = serverEventBus.subscribe(fakeRes);
    const countBefore = serverEventBus.getClientCount();
    serverEventBus.unsubscribe(id);
    expect(serverEventBus.getClientCount()).toBe(countBefore - 1);
  });

  it('publish diffuse aux abonnés', () => {
    const fakeRes = { write: jest.fn() };
    const id = serverEventBus.subscribe(fakeRes);
    serverEventBus.publish({
      type: 'test.event',
      severity: 'info',
      source: 'backend',
      message: 'test publish',
    });
    expect(fakeRes.write).toHaveBeenCalledTimes(1);
    const call = fakeRes.write.mock.calls[0][0];
    expect(call).toContain('test publish');
    serverEventBus.unsubscribe(id);
  });

  it('publish ne diffuse pas si aucun abonné', () => {
    const before = serverEventBus.getClientCount();
    expect(before).toBe(0);
    expect(() => {
      serverEventBus.publish({ type: 't', severity: 'info', source: 'backend', message: 'x' });
    }).not.toThrow();
  });

  it('publish supprime le client si write lève une erreur', () => {
    const fakeRes = { write: jest.fn().mockImplementation(() => { throw new Error('broken'); }) };
    const id = serverEventBus.subscribe(fakeRes);
    const countBefore = serverEventBus.getClientCount();
    serverEventBus.publish({ type: 't', severity: 'info', source: 'backend', message: 'err' });
    expect(serverEventBus.getClientCount()).toBe(countBefore - 1);
    serverEventBus.unsubscribe(id);
  });
});

describe('serverEventBus — masquage données sensibles', () => {
  it('masque les tokens Bearer dans les messages', () => {
    const sensitive = ['abc123', 'xyz789', 'secret'].join('');
    const safe = serverEventBus._sanitizeEvent({
      type: 'test',
      severity: 'info',
      source: 'backend',
      message: `Authorization: Bearer ${sensitive}`,
    });
    expect(safe.message).not.toContain(sensitive);
    expect(safe.message).toContain('[masqué]');
  });

  it('masque les chemins Windows absolus', () => {
    const safe = serverEventBus._sanitizeEvent({
      type: 'test',
      severity: 'info',
      source: 'backend',
      message: 'Erreur dans C:\\Users\\Youss\\secret.txt',
    });
    expectNoSensitiveLeak({ message: safe.message });
  });

  it('ne contient aucune donnée sensible dans le résultat publié', () => {
    const sensitive = ['secret', 'token', '12345'].join('');
    const fakeRes = { write: jest.fn() };
    const id = serverEventBus.subscribe(fakeRes);
    serverEventBus.publish({
      type: 'test',
      severity: 'info',
      source: 'backend',
      message: `Bearer ${sensitive}`,
    });
    const written = fakeRes.write.mock.calls[0]?.[0] ?? '';
    expect(written).not.toContain(sensitive);
    serverEventBus.unsubscribe(id);
  });
});

/* -----------------------------------------------
   GET /api/events/stream — tests HTTP
----------------------------------------------- */
describe('GET /api/events/stream — headers SSE', () => {
  let server;
  let port;

  beforeAll((done) => {
    server = app.listen(0, () => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  it('retourne les bons headers SSE', (done) => {
    const req = http.get(
      `http://localhost:${port}/api/events/stream`,
      { headers: { Accept: 'text/event-stream' } },
      (res) => {
        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toMatch(/text\/event-stream/);
        expect(res.headers['cache-control']).toMatch(/no-cache/);
        expect(res.headers['connection']).toMatch(/keep-alive/);
        req.destroy();
        done();
      }
    );
    req.on('error', done);
  });

  it('envoie l\'événement sse.connected à la connexion', (done) => {
    const req = http.get(
      `http://localhost:${port}/api/events/stream`,
      { headers: { Accept: 'text/event-stream' } },
      (res) => {
        let buffer = '';
        res.on('data', (chunk) => {
          buffer += chunk.toString();
          if (buffer.includes('sse.connected')) {
            expect(buffer).toContain('sse.connected');
            expect(buffer).toContain('"source":"backend"');
            req.destroy();
            done();
          }
        });
      }
    );
    req.on('error', done);
  });

  it('heartbeat timer ne contient pas de données sensibles', (done) => {
    const req = http.get(
      `http://localhost:${port}/api/events/stream`,
      { headers: { Accept: 'text/event-stream' } },
      (res) => {
        let buffer = '';
        res.on('data', (chunk) => {
          buffer += chunk.toString();
          if (buffer.includes('sse.connected')) {
            expect(buffer).not.toMatch(/Bearer\s+\S{10,}/);
            expect(buffer).not.toMatch(/password=/i);
            req.destroy();
            done();
          }
        });
      }
    );
    req.on('error', done);
  });
});

describe('GET /api/events/stream — sécurité origine', () => {
  it('refuse une origine non locale avec 403', async () => {
    const res = await request(app)
      .get('/api/events/stream')
      .set('Origin', 'http://evil-site.com');
    expect(res.status).toBe(403);
    expect(res.body.localOnly).toBe(true);
  });

  it('accepte une requête sans en-tête Origin', (done) => {
    let server;
    server = app.listen(0, () => {
      const { port } = server.address();
      const req = http.get(
        `http://localhost:${port}/api/events/stream`,
        (res) => {
          expect(res.statusCode).toBe(200);
          req.destroy();
          server.close(done);
        }
      );
      req.on('error', () => server.close(done));
    });
  });
});

describe('GET /api/events/client-count', () => {
  it('retourne le nombre de clients connectés', async () => {
    const res = await request(app).get('/api/events/client-count').expect(200);
    expect(typeof res.body.clients).toBe('number');
  });
});

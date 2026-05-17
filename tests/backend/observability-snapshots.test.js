const request = require('supertest');
const { app } = require('../../server');
const { expectNoSensitiveLeak } = require('../helpers/sensitive');

function expectNoSnapshotLeak(body) {
  const text = JSON.stringify(body);
  expectNoSensitiveLeak(body);
  expect(text).not.toMatch(/\bBearer\b/i);
  expect(text).not.toMatch(/\btoken\b/i);
  expect(text).not.toMatch(/runtimeContentRaw|fileContent/i);
  expect(text).not.toMatch(/logs bruts|raw logs/i);
}

describe('observability snapshots API', () => {
  let createdSnapshot = null;

  it('POST /api/observability/snapshots creates a snapshot', async () => {
    const res = await request(app)
      .post('/api/observability/snapshots')
      .expect(201);

    expect(res.type).toMatch(/json/);
    expect(['ok', 'warning', 'error']).toContain(res.body.status);
    expect(res.body.phase).toBe(18);
    expect(res.body.backend).toEqual(expect.any(Object));
    expect(res.body.integrations).toEqual(expect.any(Object));
    expect(res.body.security).toEqual(expect.any(Object));
    expect(res.body.runtime).toEqual(expect.any(Object));
    expectNoSnapshotLeak(res.body);

    createdSnapshot = res.body;
  });

  it('GET /api/observability/snapshots returns list', async () => {
    const res = await request(app)
      .get('/api/observability/snapshots')
      .expect(200);

    expect(res.type).toMatch(/json/);
    expect(res.body.snapshots).toEqual(expect.any(Array));
    expect(typeof res.body.total).toBe('number');
    expectNoSnapshotLeak(res.body);
  });

  it('GET /api/observability/snapshots/latest returns latest snapshot', async () => {
    const res = await request(app)
      .get('/api/observability/snapshots/latest')
      .expect(res => {
        if (res.status !== 200 && res.status !== 404) {
          throw new Error(`Expected 200 or 404, got ${res.status}`);
        }
      });

    if (res.status === 200) {
      expect(res.type).toMatch(/json/);
      expect(['ok', 'warning', 'error']).toContain(res.body.status);
      expectNoSnapshotLeak(res.body);
    }
  });

  it('GET /api/observability/snapshots/stats returns counters', async () => {
    const res = await request(app)
      .get('/api/observability/snapshots/stats')
      .expect(200);

    expect(res.type).toMatch(/json/);
    expect(typeof res.body.total).toBe('number');
    expect(typeof res.body.okCount).toBe('number');
    expect(typeof res.body.warningCount).toBe('number');
    expect(typeof res.body.errorCount).toBe('number');
    expect(res.body).toHaveProperty('statusChanges');
    expectNoSnapshotLeak(res.body);
  });

  it('GET /api/observability/snapshots/trends returns trends', async () => {
    const res = await request(app)
      .get('/api/observability/snapshots/trends')
      .expect(200);

    expect(res.type).toMatch(/json/);
    expect(res.body).toHaveProperty('statusTrend');
    expect(res.body).toHaveProperty('warningFrequency');
    expect(res.body).toHaveProperty('errorFrequency');
    expect(res.body).toHaveProperty('memoryTrend');
    expect(res.body).toHaveProperty('notificationTrend');
    expectNoSnapshotLeak(res.body);
  });

  it('GET /api/observability/snapshots/safety returns localOnly true', async () => {
    const res = await request(app)
      .get('/api/observability/snapshots/safety')
      .expect(200);

    expect(res.body.localOnly).toBe(true);
    expect(res.body.runtimeContentHidden).toBe(true);
    expect(res.body.logsContentHidden).toBe(true);
    expect(res.body.secretsMasked).toBe(true);
    expect(res.body.storagePathMasked).toBe(true);
    expect(typeof res.body.maxItems).toBe('number');
  });

  it('snapshot contains no sensitive data', async () => {
    const res = await request(app)
      .post('/api/observability/snapshots')
      .expect(201);

    const text = JSON.stringify(res.body);
    expect(text).not.toMatch(/Bearer\s+\S+/i);
    expect(text).not.toMatch(/token\s*[:=]\s*\S+/i);
    expect(text).not.toMatch(/\b\d{15}\b/); // IMEI
    expect(text).not.toMatch(/(?:192\.168|10\.|172\.(?:1[6-9]|2\d|3[01]))\.\d{1,3}\.\d{1,3}/); // IP complète
    expect(text).not.toMatch(/[A-Za-z]:\\[^\s"',;]{10,}/); // chemin absolu Windows
    expect(text).not.toMatch(/\/(?:Users|home|root)\//); // chemin absolu Unix
  });

  it('DELETE /api/observability/snapshots clears history', async () => {
    const res = await request(app)
      .delete('/api/observability/snapshots')
      .expect(200);

    expect(res.body.status).toBe('ok');
    expect(typeof res.body.cleared).toBe('number');

    const listRes = await request(app)
      .get('/api/observability/snapshots')
      .expect(200);

    expect(listRes.body.total).toBe(0);
    expect(listRes.body.snapshots).toHaveLength(0);
  });
});

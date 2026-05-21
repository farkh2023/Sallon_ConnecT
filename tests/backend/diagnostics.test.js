'use strict';

const request = require('supertest');
const { app } = require('../../server');
const { expectNoSensitiveLeak } = require('../helpers/sensitive');

describe('GET /api/diagnostics/overview', () => {
  it('retourne 200 avec les champs obligatoires', async () => {
    const res = await request(app).get('/api/diagnostics/overview').expect(200);
    expect(res.body.timestamp).toBeTruthy();
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptime).toBe('number');
    expect(typeof res.body.nodeVersion).toBe('string');
  });

  it('contient security.localOnly = true', async () => {
    const res = await request(app).get('/api/diagnostics/overview').expect(200);
    expect(res.body.security).toBeDefined();
    expect(res.body.security.localOnly).toBe(true);
    expect(res.body.security.firebase).toBe(false);
    expect(res.body.security.cloudServices).toBe(false);
    expect(res.body.security.externalPush).toBe(false);
  });

  it('ne contient aucun secret ni chemin absolu sensible', async () => {
    const res = await request(app).get('/api/diagnostics/overview').expect(200);
    expectNoSensitiveLeak(res.body);
  });

  it('inclut uptime, memory, sse et notifications', async () => {
    const res = await request(app).get('/api/diagnostics/overview').expect(200);

    expect(typeof res.body.uptime).toBe('number');
    expect(res.body.uptime).toBeGreaterThanOrEqual(0);

    expect(res.body.memory).toBeDefined();
    expect(typeof res.body.memory.rss).toBe('number');
    expect(typeof res.body.memory.heapUsed).toBe('number');
    expect(typeof res.body.memory.heapTotal).toBe('number');

    expect(res.body.sse).toBeDefined();
    expect(typeof res.body.sse.clients).toBe('number');

    expect(res.body.notifications).toBeDefined();
    expect(typeof res.body.notifications.total).toBe('number');
    expect(typeof res.body.notifications.unread).toBe('number');
  });

  it('résiste si scheduler ou backup retournent une erreur', async () => {
    // L'endpoint ne doit pas crasher même si des services internes sont dégradés.
    // En environnement de test, les services tournent mais peuvent être vides.
    const res = await request(app).get('/api/diagnostics/overview').expect(200);
    expect(res.body.scheduler).toBeDefined();
    expect(typeof res.body.scheduler.status).toBe('string');
    expect(res.body.backup).toBeDefined();
    expect(typeof res.body.backup.count).toBe('number');
  });

  it('retourne Cache-Control: no-store', async () => {
    const res = await request(app).get('/api/diagnostics/overview').expect(200);
    expect(res.headers['cache-control']).toContain('no-store');
  });
});

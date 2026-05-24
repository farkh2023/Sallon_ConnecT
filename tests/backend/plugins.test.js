'use strict';

/**
 * plugins.test.js — Phase 43
 * Teste les 4 endpoints plugins + invariants de securite + fonctions unitaires.
 */

// ---------- mocks ----------------------------------------------------------

jest.mock('../../server/src/services/plugins/pluginRegistry', () => ({
  listPlugins:   jest.fn().mockReturnValue([
    {
      id:          'example-plugin',
      name:        'Plugin exemple',
      version:     '1.0.0',
      description: 'Plugin de demonstration.',
      author:      'local',
      permissions: [],
      localOnly:   true,
      enabled:     false,
      valid:       true,
      error:       null,
    },
  ]),
  enablePlugin:  jest.fn().mockReturnValue({ ok: true }),
  disablePlugin: jest.fn().mockReturnValue({ ok: true }),
}));

const { app } = require('../../server');
const request  = require('supertest');

// ---------- GET /api/plugins/safety ----------------------------------------

describe('GET /api/plugins/safety', () => {
  it('retourne HTTP 200', async () => {
    const res = await request(app).get('/api/plugins/safety');
    expect(res.status).toBe(200);
  });

  it('localOnly=true', async () => {
    const res = await request(app).get('/api/plugins/safety');
    expect(res.body.localOnly).toBe(true);
  });

  it('noNetworkByDefault=true', async () => {
    const res = await request(app).get('/api/plugins/safety');
    expect(res.body.noNetworkByDefault).toBe(true);
  });

  it('noAutoInstall=true', async () => {
    const res = await request(app).get('/api/plugins/safety');
    expect(res.body.noAutoInstall).toBe(true);
  });

  it('noCloudSync=true', async () => {
    const res = await request(app).get('/api/plugins/safety');
    expect(res.body.noCloudSync).toBe(true);
  });

  it('errorIsolation=true', async () => {
    const res = await request(app).get('/api/plugins/safety');
    expect(res.body.errorIsolation).toBe(true);
  });

  it('manualApprovalRequired=true', async () => {
    const res = await request(app).get('/api/plugins/safety');
    expect(res.body.manualApprovalRequired).toBe(true);
  });

  it('permissionsAllowlist est un tableau', async () => {
    const res = await request(app).get('/api/plugins/safety');
    expect(Array.isArray(res.body.permissionsAllowlist)).toBe(true);
  });
});

// ---------- GET /api/plugins/list ------------------------------------------

describe('GET /api/plugins/list', () => {
  it('retourne HTTP 200', async () => {
    const res = await request(app).get('/api/plugins/list');
    expect(res.status).toBe(200);
  });

  it('retourne plugins tableau + total nombre', async () => {
    const res = await request(app).get('/api/plugins/list');
    expect(Array.isArray(res.body.plugins)).toBe(true);
    expect(typeof res.body.total).toBe('number');
  });

  it('chaque plugin a les champs requis', async () => {
    const res = await request(app).get('/api/plugins/list');
    const p   = res.body.plugins[0];
    expect(p).toHaveProperty('id');
    expect(p).toHaveProperty('name');
    expect(p).toHaveProperty('version');
    expect(p).toHaveProperty('localOnly');
    expect(p).toHaveProperty('enabled');
    expect(p).toHaveProperty('valid');
  });

  it('ne contient pas C:\\Users\\ dans la reponse', async () => {
    const res = await request(app).get('/api/plugins/list');
    expect(JSON.stringify(res.body)).not.toMatch(/C:\\Users\\/i);
  });

  it('ne contient pas Bearer dans la reponse', async () => {
    const res = await request(app).get('/api/plugins/list');
    expect(JSON.stringify(res.body)).not.toMatch(/Bearer\s+[A-Za-z0-9]/i);
  });
});

// ---------- POST /api/plugins/:id/enable -----------------------------------

describe('POST /api/plugins/:id/enable', () => {
  it('active un plugin valide — HTTP 200', async () => {
    const res = await request(app).post('/api/plugins/example-plugin/enable');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('rejette .. — HTTP 400', async () => {
    const res = await request(app).post('/api/plugins/..%2Fsecret/enable');
    expect(res.status).toBe(400);
  });

  it('rejette / encode — HTTP 400', async () => {
    const res = await request(app).post('/api/plugins/foo%2Fbar/enable');
    expect(res.status).toBe(400);
  });

  it('rejette \\ encode — HTTP 400', async () => {
    const res = await request(app).post('/api/plugins/foo%5Cbar/enable');
    expect(res.status).toBe(400);
  });

  it('rejette caractere special ! — HTTP 400', async () => {
    const res = await request(app).post('/api/plugins/x!invalid/enable');
    expect(res.status).toBe(400);
  });
});

// ---------- POST /api/plugins/:id/disable ----------------------------------

describe('POST /api/plugins/:id/disable', () => {
  it('desactive un plugin — HTTP 200', async () => {
    const res = await request(app).post('/api/plugins/example-plugin/disable');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('rejette .. — HTTP 400', async () => {
    const res = await request(app).post('/api/plugins/..%2Fsecret/disable');
    expect(res.status).toBe(400);
  });

  it('rejette / encode — HTTP 400', async () => {
    const res = await request(app).post('/api/plugins/foo%2Fbar/disable');
    expect(res.status).toBe(400);
  });

  it('rejette \\ encode — HTTP 400', async () => {
    const res = await request(app).post('/api/plugins/foo%5Cbar/disable');
    expect(res.status).toBe(400);
  });
});

// ---------- pluginSafety — unitaires ---------------------------------------

describe('pluginSafety — fonctions directes', () => {
  const { sanitizePluginId, validateManifest, getPluginSafety } =
    require('../../server/src/services/plugins/pluginSafety');

  it('sanitizePluginId accepte un ID valide', () => {
    expect(sanitizePluginId('example-plugin')).toBe('example-plugin');
    expect(sanitizePluginId('mon_plugin.v2')).toBe('mon_plugin.v2');
    expect(sanitizePluginId('plugin-123')).toBe('plugin-123');
  });

  it('sanitizePluginId rejette ..', () => {
    expect(sanitizePluginId('..')).toBeNull();
    expect(sanitizePluginId('../secret')).toBeNull();
    expect(sanitizePluginId('foo/../bar')).toBeNull();
  });

  it('sanitizePluginId rejette /', () => {
    expect(sanitizePluginId('foo/bar')).toBeNull();
    expect(sanitizePluginId('/etc/passwd')).toBeNull();
  });

  it('sanitizePluginId rejette \\', () => {
    expect(sanitizePluginId('foo\\bar')).toBeNull();
  });

  it('sanitizePluginId rejette caracteres speciaux hors allowlist', () => {
    expect(sanitizePluginId('x!invalid')).toBeNull();
    expect(sanitizePluginId('test@host')).toBeNull();
    expect(sanitizePluginId('a b')).toBeNull();
  });

  it('validateManifest rejette localOnly absent', () => {
    const r = validateManifest({ id: 'test', name: 'Test', version: '1.0.0', permissions: [] });
    expect(r.ok).toBe(false);
  });

  it('validateManifest rejette localOnly=false', () => {
    const r = validateManifest({ id: 'test', name: 'Test', version: '1.0.0', localOnly: false, permissions: [] });
    expect(r.ok).toBe(false);
  });

  it('validateManifest rejette permission non autorisee', () => {
    const r = validateManifest({ id: 'test', name: 'Test', version: '1.0.0', localOnly: true, permissions: ['network:external'] });
    expect(r.ok).toBe(false);
  });

  it('validateManifest rejette id manquant', () => {
    const r = validateManifest({ name: 'Test', version: '1.0.0', localOnly: true, permissions: [] });
    expect(r.ok).toBe(false);
  });

  it('validateManifest accepte un manifest valide sans permissions', () => {
    const r = validateManifest({ id: 'test', name: 'Test', version: '1.0.0', localOnly: true, permissions: [] });
    expect(r.ok).toBe(true);
    expect(r.error).toBeNull();
  });

  it('validateManifest accepte une permission autorisee', () => {
    const r = validateManifest({ id: 'test', name: 'Test', version: '1.0.0', localOnly: true, permissions: ['read:diagnostics'] });
    expect(r.ok).toBe(true);
  });

  it('getPluginSafety retourne tous les flags de securite', () => {
    const s = getPluginSafety();
    expect(s.localOnly).toBe(true);
    expect(s.noNetworkByDefault).toBe(true);
    expect(s.noAutoInstall).toBe(true);
    expect(s.noCloudSync).toBe(true);
    expect(s.errorIsolation).toBe(true);
    expect(s.manualApprovalRequired).toBe(true);
    expect(Array.isArray(s.permissionsAllowlist)).toBe(true);
    expect(s.permissionsAllowlist.length).toBeGreaterThan(0);
  });
});

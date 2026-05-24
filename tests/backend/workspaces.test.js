'use strict';

const request = require('supertest');
const express = require('express');
const path    = require('path');
const fs      = require('fs');

const ROOT = process.cwd();
let counter = 0;
let tempRoot;
let app;

function buildApp() {
  jest.resetModules();
  const testApp = express();
  testApp.use(express.json());
  const router = require('../../server/src/routes/workspaces');
  testApp.use('/api/workspaces', router);
  return testApp;
}

function tempDir() {
  counter += 1;
  return path.join(ROOT, 'tests', '.runtime', `workspaces-${Date.now()}-${counter}`);
}

beforeEach(() => {
  tempRoot = tempDir();
  fs.mkdirSync(tempRoot, { recursive: true });
  process.chdir(tempRoot);
  process.env.SALLON_WORKSPACES_ENABLED = 'true';
  process.env.SALLON_DEFAULT_WORKSPACE = 'default';
  process.env.SALLON_WORKSPACE_MAX_COUNT = '20';
  app = buildApp();
});

afterEach(() => {
  process.chdir(ROOT);
  jest.resetModules();
  if (tempRoot && fs.existsSync(tempRoot)) fs.rmSync(tempRoot, { recursive: true, force: true });
});

describe('workspaces API', () => {
  it('retourne un statut local-only avec workspace default', async () => {
    const res = await request(app).get('/api/workspaces/status').expect(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.enabled).toBe(true);
    expect(res.body.current).toBe('default');
    expect(res.body.safety.localOnly).toBe(true);
  });

  it('cree puis liste un workspace', async () => {
    await request(app)
      .post('/api/workspaces')
      .send({ id: 'ws_test1', name: 'Test WS' })
      .expect(201);

    const list = await request(app).get('/api/workspaces').expect(200);
    expect(list.body.total).toBe(2);
    expect(list.body.profiles.some(p => p.id === 'ws_test1')).toBe(true);
  });

  it('retourne le workspace courant et switche vers un workspace existant', async () => {
    await request(app).post('/api/workspaces').send({ id: 'ws_switch', name: 'Switch' }).expect(201);

    const before = await request(app).get('/api/workspaces/current').expect(200);
    expect(before.body.id).toBe('default');

    const switched = await request(app).post('/api/workspaces/switch').send({ id: 'ws_switch' }).expect(200);
    expect(switched.body.ok).toBe(true);
    expect(switched.body.current.id).toBe('ws_switch');

    const after = await request(app).get('/api/workspaces/current').expect(200);
    expect(after.body.id).toBe('ws_switch');
  });

  it('met a jour un workspace', async () => {
    await request(app).post('/api/workspaces').send({ id: 'ws_edit', name: 'Avant' }).expect(201);
    const updated = await request(app)
      .put('/api/workspaces/ws_edit')
      .send({ name: 'Apres', settings: { theme: 'light', language: 'en' } })
      .expect(200);

    expect(updated.body.profile.name).toBe('Apres');
    expect(updated.body.profile.settings.theme).toBe('light');
  });

  it('bloque la suppression du workspace default sans confirmation forte', async () => {
    await request(app).post('/api/workspaces').send({ id: 'ws_other', name: 'Other' }).expect(201);
    await request(app).post('/api/workspaces/switch').send({ id: 'ws_other' }).expect(200);

    const res = await request(app).delete('/api/workspaces/default').send({}).expect(400);
    expect(res.body.error).toMatch(/confirmation/i);
  });

  it('refuse de supprimer le workspace courant', async () => {
    await request(app).post('/api/workspaces').send({ id: 'ws_current', name: 'Current' }).expect(201);
    await request(app).post('/api/workspaces/switch').send({ id: 'ws_current' }).expect(200);

    const res = await request(app)
      .delete('/api/workspaces/ws_current')
      .send({ confirmation: 'SUPPRIMER' })
      .expect(400);
    expect(res.body.error).toMatch(/courant|current/i);
  });

  it('supprime un workspace non courant', async () => {
    await request(app).post('/api/workspaces').send({ id: 'ws_delete', name: 'Delete' }).expect(201);
    await request(app).delete('/api/workspaces/ws_delete').send({ confirmation: 'SUPPRIMER' }).expect(200);

    const list = await request(app).get('/api/workspaces').expect(200);
    expect(list.body.profiles.some(p => p.id === 'ws_delete')).toBe(false);
  });

  it('exporte un workspace sans secret ni chemin sensible', async () => {
    await request(app)
      .post('/api/workspaces')
      .send({
        id: 'ws_secret',
        name: 'Bearer abc123',
        description: 'password=topsecret C:\\Users\\Youss\\secret',
      })
      .expect(201);

    const res = await request(app).post('/api/workspaces/ws_secret/export').send({}).expect(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.filename).toMatch(/^workspace-ws_secret-/);

    const exported = fs.readFileSync(path.join(tempRoot, 'runtime', 'workspaces', 'exports', res.body.filename), 'utf8');
    expect(exported).not.toContain('abc123');
    expect(exported).not.toContain('topsecret');
    expect(exported).not.toContain('C:\\Users\\Youss');
    expect(exported).toContain('[MASQUE]');
  });

  it('importe un workspace valide et refuse un import invalide', async () => {
    await request(app)
      .post('/api/workspaces/import')
      .send({
        version: '1.0',
        localOnly: true,
        profile: { id: 'ws_import', name: 'Import', description: '', localOnly: true },
        settings: { theme: 'system', language: 'fr' },
      })
      .expect(201);

    await request(app)
      .post('/api/workspaces/import')
      .send({ localOnly: false, profile: { id: 'ws_bad', name: 'Bad', localOnly: false } })
      .expect(400);
  });

  it('bloque le path traversal dans les routes et les IDs', async () => {
    await request(app).get('/api/workspaces/%2e%2e%2fhack').expect(400);
    await request(app).post('/api/workspaces/switch').send({ id: '../hack' }).expect(400);
  });

  it('retourne des chemins workspaceContext surs pour un workspace non-default', async () => {
    await request(app).post('/api/workspaces').send({ id: 'ws_ctx', name: 'Context' }).expect(201);
    const { getContextPaths } = require('../../server/src/workspaces/workspaceContext');
    const ctx = getContextPaths('ws_ctx');
    const expectedRoot = path.join(tempRoot, 'runtime', 'workspaces', 'ws_ctx');

    expect(ctx.workspaceId).toBe('ws_ctx');
    expect(ctx.root).toBe(path.resolve(expectedRoot));
    for (const key of ['memory', 'rag', 'knowledge', 'workflows', 'agents', 'dashboards', 'searchHistory']) {
      expect(path.resolve(ctx[key]).startsWith(path.resolve(expectedRoot) + path.sep)).toBe(true);
      expect(ctx[key]).not.toContain('..');
    }
  });
});

'use strict';

const express = require('express');
const request = require('supertest');

// ── mocks ──────────────────────────────────────────────────────────────────────

jest.mock('../../server/src/search/globalSearchIndexer', () => ({
  getIndex:      jest.fn(() => [
    { id: 'result_cmd_open.dashboard', type: 'command', title: 'Ouvrir le dashboard', description: 'Naviguer vers le tableau de bord', score: 1, source: 'command-registry', target: '/dashboard', tags: ['dashboard'], actions: ['open'], localOnly: true, _commandId: 'open.dashboard', _tokens: ['ouvrir', 'dashboard'] },
    { id: 'result_kb_kb1', type: 'knowledge', title: 'Agent diagnostic', description: 'Configure l\'agent', score: 1.1, source: 'knowledge-base', target: null, tags: ['agent'], actions: ['open', 'copy'], localOnly: true, _tokens: ['agent', 'diagnostic'] },
  ]),
  rebuildIndex:  jest.fn(() => []),
  invalidateIndex: jest.fn(),
  tokenize:      jest.fn(t => (t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').split(/\W+/).filter(Boolean)),
}));

jest.mock('../../server/src/search/globalSearchRetriever', () => ({
  search:      jest.fn((q, filters, topK) => {
    if (!q || !q.trim()) return { results: [], groups: {}, total: 0 };
    const r = [{ id: 'result_cmd_open.dashboard', type: 'command', title: 'Ouvrir le dashboard', description: 'Naviguer', score: 2, source: 'command-registry', target: '/dashboard', tags: ['dashboard'], actions: ['open'], localOnly: true }];
    return { results: r, groups: { command: r }, total: r.length };
  }),
  suggestQuery: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('../../server/src/search/commandRegistry', () => ({
  getAllCommands: jest.fn(() => [
    { id: 'open.dashboard', title: 'Ouvrir le dashboard', description: 'Naviguer', category: 'navigation', target: '/dashboard', actions: ['open'], tags: ['dashboard'], safe: true, dryRunRequired: false },
    { id: 'run.diagnostics.dry', title: 'Lancer diagnostics', description: 'Dry-run', category: 'action', target: '/api/ai', actions: ['run-dry'], tags: ['diagnostics'], safe: true, dryRunRequired: true },
  ]),
  getCommand: jest.fn(id => {
    if (id === 'open.dashboard') return { id: 'open.dashboard', title: 'Ouvrir le dashboard', description: 'Naviguer', category: 'navigation', target: '/dashboard', actions: ['open'], tags: ['dashboard'], safe: true, dryRunRequired: false };
    if (id === 'run.diagnostics.dry') return { id: 'run.diagnostics.dry', title: 'Lancer diagnostics', description: 'Dry-run', category: 'action', target: '/api/ai', actions: ['run-dry'], tags: ['diagnostics'], safe: true, dryRunRequired: true };
    return null;
  }),
  searchCommands: jest.fn(q => []),
}));

jest.mock('../../server/src/search/commandCenter', () => ({
  previewCommand: jest.fn(id => {
    if (id === 'open.dashboard') return { id, title: 'Ouvrir le dashboard', description: 'Naviguer', category: 'navigation', target: '/dashboard', actions: ['open'], tags: ['dashboard'], safe: true, dryRunRequired: false, localOnly: true };
    return null;
  }),
  runCommand: jest.fn(id => {
    if (id === 'open.dashboard') return { ok: true, action: 'navigate', target: '/dashboard', command: id, dryRun: false };
    if (id === 'shell.execute')  return { ok: false, error: 'commande_non_securisee' };
    return { ok: false, error: 'commande_introuvable' };
  }),
}));

jest.mock('../../server/src/search/globalSearchSafety', () => ({
  getSearchSafety:   jest.fn(() => ({ localOnly: true, noCloudAllowed: true, secretMaskingEnabled: true, blockedActions: ['shell.execute'], historyLocalOnly: true, clearHistoryConfirm: true })),
  sanitizeResult:    jest.fn(r => r),
  isActionBlocked:   jest.fn(a => a === 'shell.execute'),
  validateCommandId: jest.fn(id => /^[a-zA-Z0-9._-]+$/.test(id)),
  maskSecrets:       jest.fn(t => t),
}));

jest.mock('../../server/src/search/globalSearchTypes', () => ({
  validateSearchQuery: jest.fn(q => ({ valid: !!q && q.trim().length > 0, errors: (!q || !q.trim()) ? ['query_vide'] : [] })),
  TOP_K: jest.fn(() => 10),
  SEARCH_RESULT_TYPES: new Set(['knowledge','memory','command']),
  SAFE_ACTIONS: new Set(['open','copy']),
  BLOCKED_ACTIONS: new Set(['shell.execute']),
  MAX_HISTORY: jest.fn(() => 50),
  MAX_QUERY: 500,
}));

// ── app builder ────────────────────────────────────────────────────────────────

function buildApp() {
  const app    = express();
  app.use(express.json());
  const router = require('../../server/src/routes/search');
  app.use('/api/search', router);
  return app;
}

// ── tests ──────────────────────────────────────────────────────────────────────

beforeEach(() => { jest.clearAllMocks(); });

describe('GET /api/search/status', () => {
  it('retourne le statut', async () => {
    const res = await request(buildApp()).get('/api/search/status');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.safety.localOnly).toBe(true);
  });

  it('retourne le nombre de commandes', async () => {
    const res = await request(buildApp()).get('/api/search/status');
    expect(res.body.commands).toBe(2);
  });
});

describe('GET /api/search/commands', () => {
  it('retourne toutes les commandes', async () => {
    const res = await request(buildApp()).get('/api/search/commands');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.commands)).toBe(true);
    expect(res.body.total).toBe(2);
  });
});

describe('POST /api/search', () => {
  it('retourne des resultats pour une query valide', async () => {
    const res = await request(buildApp()).post('/api/search').send({ query: 'dashboard' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.query).toBe('dashboard');
  });

  it('retourne 400 pour une query vide', async () => {
    const res = await request(buildApp()).post('/api/search').send({ query: '' });
    expect(res.status).toBe(400);
  });

  it('retourne 400 sans query', async () => {
    const res = await request(buildApp()).post('/api/search').send({});
    expect(res.status).toBe(400);
  });

  it('ne fait aucun appel cloud', async () => {
    const res = await request(buildApp()).post('/api/search').send({ query: 'test' });
    expect(res.status).toBe(200);
    const text = JSON.stringify(res.body);
    expect(text).not.toContain('cloud');
    expect(text).not.toContain('C:\\Users\\');
  });

  it('retourne des resultats groupes par type', async () => {
    const res = await request(buildApp()).post('/api/search').send({ query: 'dashboard' });
    expect(res.body.groups).toBeDefined();
    expect(typeof res.body.groups).toBe('object');
  });
});

describe('POST /api/search/commands/:id/preview', () => {
  it('retourne un apercu de commande valide', async () => {
    const res = await request(buildApp()).post('/api/search/commands/open.dashboard/preview').send({});
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.preview.id).toBe('open.dashboard');
    expect(res.body.preview.localOnly).toBe(true);
  });

  it('retourne 404 pour commande inconnue', async () => {
    const res = await request(buildApp()).post('/api/search/commands/inexistant/preview').send({});
    expect(res.status).toBe(404);
  });

  it('bloque path traversal', async () => {
    const { validateCommandId } = require('../../server/src/search/globalSearchSafety');
    validateCommandId.mockReturnValueOnce(false);
    const res = await request(buildApp()).post('/api/search/commands/..%2Fetc%2Fpasswd/preview').send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /api/search/commands/:id/run', () => {
  it('execute une commande de navigation sure', async () => {
    const res = await request(buildApp()).post('/api/search/commands/open.dashboard/run').send({});
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.action).toBe('navigate');
  });

  it('refuse une commande interdite', async () => {
    const res = await request(buildApp()).post('/api/search/commands/shell.execute/run').send({});
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it('retourne 404 pour commande inconnue', async () => {
    const res = await request(buildApp()).post('/api/search/commands/inexistant/run').send({});
    expect(res.status).toBe(400);
  });
});

describe('securite', () => {
  it('secrets masques dans les resultats', async () => {
    const res = await request(buildApp()).post('/api/search').send({ query: 'agent' });
    expect(JSON.stringify(res.body)).not.toMatch(/Bearer\s+\S+/);
    expect(JSON.stringify(res.body)).not.toContain('/home/');
  });
});

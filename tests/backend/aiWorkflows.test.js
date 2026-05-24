'use strict';

/**
 * aiWorkflows.test.js — Phase 48
 * Teste les endpoints workflows IA visuels + fonctions de securite.
 */

// ── Mocks ────────────────────────────────────────────────────────────────────

const MOCK_RUN = {
  runId: 'wfrun123',
  workflowId: 'diagnostic-review',
  workflowName: 'Revue diagnostique',
  status: 'completed',
  nodeResults: [
    { nodeId: 'n1', nodeType: 'diagnostic', output: 'OK', ok: true, durationMs: 10 },
  ],
  citations: [],
  rejectedActions: [],
  safetySummary: { localOnly: true, dryRun: true, nodesRun: 1, nodesFailed: 0, rejectedTotal: 0 },
  summary: 'Systeme en bonne sante.',
  startedAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
  dryRun: true,
};

const mockRuns = [];

jest.mock('../../server/src/ai/workflows/workflowStore', () => ({
  listRuns:       jest.fn(() => [...mockRuns]),
  getRun:         jest.fn(id => mockRuns.find(r => r.runId === id) || null),
  clearRuns:      jest.fn(() => { mockRuns.length = 0; return { cleared: 0 }; }),
  exportWorkflow: jest.fn(id => ({ id, name: 'Test', nodes: [], edges: [], localOnly: true, dryRun: true })),
  saveRun:        jest.fn((id, data) => mockRuns.push(data)),
}));

jest.mock('../../server/src/ai/workflows/workflowRunner', () => ({
  runWorkflow: jest.fn().mockResolvedValue(MOCK_RUN),
}));

jest.mock('../../server/src/ai/workflows/workflowRegistry', () => {
  const _wf = {
    'diagnostic-review': {
      id: 'diagnostic-review', name: 'Revue diagnostique',
      description: 'Analyse le systeme via diagnostic.',
      nodes: [{ id: 'n1', type: 'diagnostic', label: 'Diag' }],
      edges: [], triggers: [{ type: 'manual' }],
      enabled: true, localOnly: true, dryRun: true, nodeCount: 1,
    },
  };
  return {
    list:   jest.fn(() => Object.values(_wf)),
    get:    jest.fn(id => _wf[id] || null),
    create: jest.fn(raw => { _wf[raw.id] = raw; return raw; }),
    update: jest.fn((id, raw) => { _wf[id] = raw; return raw; }),
    remove: jest.fn(id => { const existed = !!_wf[id]; delete _wf[id]; return existed; }),
  };
});

jest.mock('../../server/src/ai/workflows/workflowTemplates', () => ({
  listTemplates: jest.fn(() => [
    { id: 'diagnostic-review', name: 'Revue diagnostique', description: 'Test', nodeCount: 2 },
    { id: 'security-check',    name: 'Securite',           description: 'Test', nodeCount: 3 },
  ]),
}));

jest.mock('../../server/src/services/serverEventBus', () => ({
  publish: jest.fn(),
}));

// ── App setup ─────────────────────────────────────────────────────────────────

const request = require('supertest');
const express = require('express');

function buildApp(env = {}) {
  process.env = { ...process.env, ...env };
  const app    = express();
  app.use(express.json());
  const router = require('../../server/src/routes/aiWorkflows');
  app.use('/api/ai/workflows', router);
  return app;
}

let app;
beforeAll(() => {
  process.env.SALLON_WORKFLOWS_ENABLED = 'true';
  app = buildApp({ SALLON_WORKFLOWS_ENABLED: 'true' });
});

afterEach(() => jest.clearAllMocks());

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/ai/workflows', () => {
  it('retourne la liste des workflows', async () => {
    const res = await request(app).get('/api/ai/workflows').expect(200);
    expect(res.body.workflows).toBeInstanceOf(Array);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
    expect(res.body.safety).toBeDefined();
  });

  it('inclut localOnly et dryRun dans safety', async () => {
    const res = await request(app).get('/api/ai/workflows').expect(200);
    expect(res.body.safety.localOnly).toBe(true);
    expect(res.body.safety.dryRunByDefault).toBe(true);
  });
});

describe('GET /api/ai/workflows/templates', () => {
  it('retourne les templates disponibles', async () => {
    const res = await request(app).get('/api/ai/workflows/templates').expect(200);
    expect(res.body.templates.length).toBe(2);
    expect(res.body.total).toBe(2);
  });
});

describe('GET /api/ai/workflows/runs', () => {
  it('retourne la liste des runs (vide initialement)', async () => {
    const res = await request(app).get('/api/ai/workflows/runs').expect(200);
    expect(res.body.runs).toBeInstanceOf(Array);
    expect(res.body.total).toBeGreaterThanOrEqual(0);
  });
});

describe('GET /api/ai/workflows/runs/:runId', () => {
  it('rejette un runId invalide (caracteres speciaux)', async () => {
    await request(app).get('/api/ai/workflows/runs/run!invalid').expect(400);
  });

  it('retourne 404 pour un runId inconnu', async () => {
    const { getRun } = require('../../server/src/ai/workflows/workflowStore');
    getRun.mockReturnValueOnce(null);
    await request(app).get('/api/ai/workflows/runs/unknownrun123').expect(404);
  });

  it('retourne le run si present', async () => {
    const { getRun } = require('../../server/src/ai/workflows/workflowStore');
    getRun.mockReturnValueOnce(MOCK_RUN);
    const res = await request(app).get('/api/ai/workflows/runs/wfrun123').expect(200);
    expect(res.body.runId).toBe('wfrun123');
  });
});

describe('POST /api/ai/workflows/runs/clear', () => {
  it('refuse sans confirmation', async () => {
    await request(app).post('/api/ai/workflows/runs/clear').send({}).expect(400);
  });

  it('refuse avec mauvaise confirmation', async () => {
    await request(app)
      .post('/api/ai/workflows/runs/clear')
      .send({ confirmation: 'EFFACER' })
      .expect(400);
  });

  it('efface les runs avec bonne confirmation', async () => {
    const res = await request(app)
      .post('/api/ai/workflows/runs/clear')
      .send({ confirmation: 'EFFACER_RUNS_WORKFLOWS' })
      .expect(200);
    expect(res.body.ok).toBe(true);
  });
});

describe('GET /api/ai/workflows/:id', () => {
  it('retourne un workflow valide', async () => {
    const res = await request(app).get('/api/ai/workflows/diagnostic-review').expect(200);
    expect(res.body.id).toBe('diagnostic-review');
    expect(res.body.localOnly).toBe(true);
  });

  it('rejette un id invalide (caracteres speciaux)', async () => {
    await request(app).get('/api/ai/workflows/abc!invalid').expect(400);
  });

  it('retourne 404 pour un workflow inconnu', async () => {
    const { get } = require('../../server/src/ai/workflows/workflowRegistry');
    get.mockReturnValueOnce(null);
    await request(app).get('/api/ai/workflows/unknown-wf').expect(404);
  });
});

describe('POST /api/ai/workflows/:id/run', () => {
  it('lance un workflow existant', async () => {
    const res = await request(app)
      .post('/api/ai/workflows/diagnostic-review/run')
      .send({})
      .expect(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.dryRun).toBe(true);
    expect(res.body.status).toBe('completed');
  });

  it('retourne 404 si le workflow n\'existe pas', async () => {
    const { get } = require('../../server/src/ai/workflows/workflowRegistry');
    get.mockReturnValueOnce(null);
    await request(app)
      .post('/api/ai/workflows/nonexistent/run')
      .send({})
      .expect(404);
  });

  it('retourne 503 si workflows desactives', async () => {
    process.env.SALLON_WORKFLOWS_ENABLED = 'false';
    const appDisabled = buildApp({ SALLON_WORKFLOWS_ENABLED: 'false' });
    await request(appDisabled)
      .post('/api/ai/workflows/diagnostic-review/run')
      .send({})
      .expect(503);
    process.env.SALLON_WORKFLOWS_ENABLED = 'true';
  });

  it('force dryRun=true sur le resultat', async () => {
    const res = await request(app)
      .post('/api/ai/workflows/diagnostic-review/run')
      .send({ dryRun: false })
      .expect(200);
    expect(res.body.dryRun).toBe(true);
  });
});

describe('DELETE /api/ai/workflows/:id', () => {
  it('refuse sans confirmation', async () => {
    await request(app)
      .delete('/api/ai/workflows/diagnostic-review')
      .send({})
      .expect(400);
  });

  it('refuse avec mauvaise confirmation', async () => {
    await request(app)
      .delete('/api/ai/workflows/diagnostic-review')
      .send({ confirmation: 'OUI' })
      .expect(400);
  });

  it('supprime avec confirmation SUPPRIMER', async () => {
    const res = await request(app)
      .delete('/api/ai/workflows/diagnostic-review')
      .send({ confirmation: 'SUPPRIMER' })
      .expect(200);
    expect(res.body.ok).toBe(true);
  });

  it('rejette un id invalide', async () => {
    await request(app)
      .delete('/api/ai/workflows/bad!id')
      .send({ confirmation: 'SUPPRIMER' })
      .expect(400);
  });
});

describe('POST /api/ai/workflows/import', () => {
  it('rejette un import sans id', async () => {
    await request(app)
      .post('/api/ai/workflows/import')
      .send({ name: 'Test', nodes: [], edges: [] })
      .expect(400);
  });

  it('rejette localOnly=false', async () => {
    await request(app)
      .post('/api/ai/workflows/import')
      .send({ id: 'test-wf', name: 'Test', nodes: [], edges: [], localOnly: false, dryRun: true })
      .expect(400);
  });

  it('rejette dryRun=false', async () => {
    await request(app)
      .post('/api/ai/workflows/import')
      .send({ id: 'test-wf', name: 'Test', nodes: [], edges: [], localOnly: true, dryRun: false })
      .expect(400);
  });
});

describe('validateWorkflow (securite)', () => {
  const { validateWorkflow } = require('../../server/src/ai/workflows/workflowTypes');

  it('valide un workflow minimal correct', () => {
    const result = validateWorkflow({
      id: 'test-wf', name: 'Test',
      nodes: [{ id: 'n1', type: 'diagnostic', label: 'D' }],
      edges: [], localOnly: true, dryRun: true,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejette localOnly=false', () => {
    const result = validateWorkflow({
      id: 'test-wf', name: 'Test',
      nodes: [{ id: 'n1', type: 'diagnostic', label: 'D' }],
      edges: [], localOnly: false, dryRun: true,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => /localOnly/i.test(e))).toBe(true);
  });

  it('rejette dryRun=false', () => {
    const result = validateWorkflow({
      id: 'test-wf', name: 'Test',
      nodes: [{ id: 'n1', type: 'diagnostic', label: 'D' }],
      edges: [], localOnly: true, dryRun: false,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => /dryRun/i.test(e))).toBe(true);
  });

  it('rejette un id invalide (slash)', () => {
    const result = validateWorkflow({
      id: 'bad/id', name: 'Test',
      nodes: [{ id: 'n1', type: 'diagnostic', label: 'D' }],
      edges: [], localOnly: true, dryRun: true,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => /id/i.test(e))).toBe(true);
  });

  it('rejette un type de noeud interdit', () => {
    const result = validateWorkflow({
      id: 'test-wf', name: 'Test',
      nodes: [{ id: 'n1', type: 'shell-execute', label: 'Shell' }],
      edges: [], localOnly: true, dryRun: true,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => /interdit|shell/i.test(e))).toBe(true);
  });
});

describe('getWorkflowSafety', () => {
  it('retourne les flags de securite attendus', () => {
    const { getWorkflowSafety } = require('../../server/src/ai/workflows/workflowSafety');
    const safety = getWorkflowSafety();
    expect(safety.localOnly).toBe(true);
    expect(safety.dryRunByDefault).toBe(true);
    expect(safety.noAutoExecution).toBe(true);
    expect(Array.isArray(safety.forbiddenNodeTypes)).toBe(true);
    expect(typeof safety.maxNodes).toBe('number');
  });
});

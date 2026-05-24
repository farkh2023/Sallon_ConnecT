'use strict';

/**
 * aiAgents.test.js — Phase 47
 * Teste les endpoints agents IA locaux + fonctions de securite.
 */

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../server/src/ai/agents/agentMemory', () => {
  const runs = [];
  return {
    saveRun:  jest.fn((_id, data) => { runs.push(data); }),
    listRuns: jest.fn(() => [...runs]),
    getRun:   jest.fn(id => runs.find(r => r.runId === id) || null),
    clearRuns: jest.fn(() => { runs.length = 0; return { cleared: runs.length }; }),
  };
});

jest.mock('../../server/src/ai/agents/agentOrchestrator', () => ({
  orchestrate: jest.fn().mockResolvedValue({
    runId:           'testrun123',
    status:          'completed',
    task:            'tache de test',
    agentsUsed:      ['diagnostic-agent'],
    steps:           [{
      agentId: 'diagnostic-agent', agentName: 'Diagnostic Agent',
      steps: [{ tool: 'diagnostics.read', input: '{}', output: '{"score":85}', ok: true, error: null }],
      output: 'Systeme en bonne sante. Score 85/100.',
      ok: true, error: null, citations: [], rejectedActions: [], dryRun: true,
    }],
    recommendations: [{ agentId: 'diagnostic-agent', agentName: 'Diagnostic Agent', text: 'Systeme OK', dryRun: true }],
    citations:       [],
    rejectedActions: [],
    safetySummary:   { localOnly: true, dryRun: true, noAutoExecution: true, agentsRun: 1, agentsFailed: 0, rejectedTotal: 0 },
    summary:         'Systeme en bonne sante.',
    startedAt:       '2026-05-23T12:00:00.000Z',
    completedAt:     '2026-05-23T12:00:10.000Z',
    dryRun:          true,
  }),
}));

jest.mock('../../server/src/services/serverEventBus', () => ({
  publish: jest.fn(),
}));

// ── Setup ─────────────────────────────────────────────────────────────────────

const request    = require('supertest');
const express    = require('express');

const aiAgentsRoute = require('../../server/src/routes/aiAgents');
const { validateManifest } = require('../../server/src/ai/agents/agentTypes');
const { isToolAllowed, getAgentSafety } = require('../../server/src/ai/agents/agentSafety');

const app = express();
app.use(express.json());
app.use('/api/ai/agents', aiAgentsRoute);

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/ai/agents', () => {
  it('retourne la liste des agents avec safety', async () => {
    const res = await request(app).get('/api/ai/agents');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.agents)).toBe(true);
    expect(res.body.agents.length).toBeGreaterThan(0);
    expect(res.body.safety).toBeDefined();
    expect(res.body.safety.localOnly).toBe(true);
  });

  it('tous les agents ont localOnly=true et dryRun=true', async () => {
    const res = await request(app).get('/api/ai/agents');
    for (const agent of res.body.agents) {
      expect(agent.localOnly).toBe(true);
      expect(agent.dryRun).toBe(true);
    }
  });
});

describe('GET /api/ai/agents/:id', () => {
  it('retourne un agent valide par id', async () => {
    const res = await request(app).get('/api/ai/agents/diagnostic-agent');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('diagnostic-agent');
    expect(res.body.localOnly).toBe(true);
  });

  it('retourne 404 pour un agent inexistant', async () => {
    const res = await request(app).get('/api/ai/agents/unknown-agent-xyz');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('agent_introuvable');
  });

  it('retourne 400 pour un id invalide (caracteres interdits)', async () => {
    const res = await request(app).get('/api/ai/agents/abc!invalid');
    expect(res.status).toBe(400);
  });
});

describe('POST /api/ai/agents/run', () => {
  beforeEach(() => {
    process.env.SALLON_AGENTS_ENABLED = 'true';
  });
  afterEach(() => {
    delete process.env.SALLON_AGENTS_ENABLED;
  });

  it('refuse si agents desactives', async () => {
    delete process.env.SALLON_AGENTS_ENABLED;
    const res = await request(app)
      .post('/api/ai/agents/run')
      .send({ task: 'analyser le systeme' });
    expect(res.status).toBe(503);
    expect(res.body.error).toBe('agents_disabled');
  });

  it('refuse si task absent', async () => {
    const res = await request(app)
      .post('/api/ai/agents/run')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.errors).toContain('task_requis');
  });

  it('execute la tache et retourne runId, steps, recommendations', async () => {
    const res = await request(app)
      .post('/api/ai/agents/run')
      .send({ task: 'analyser le systeme' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.runId).toBeDefined();
    expect(Array.isArray(res.body.steps)).toBe(true);
    expect(Array.isArray(res.body.recommendations)).toBe(true);
  });

  it('dryRun est true par defaut dans la reponse', async () => {
    const res = await request(app)
      .post('/api/ai/agents/run')
      .send({ task: 'test dry run' });
    expect(res.status).toBe(200);
    expect(res.body.dryRun).toBe(true);
  });

  it('retourne safetySummary avec localOnly=true', async () => {
    const res = await request(app)
      .post('/api/ai/agents/run')
      .send({ task: 'securite' });
    expect(res.status).toBe(200);
    expect(res.body.safetySummary?.localOnly).toBe(true);
    expect(res.body.safetySummary?.dryRun).toBe(true);
  });
});

describe('GET /api/ai/agents/runs', () => {
  it('retourne la liste des runs', async () => {
    const res = await request(app).get('/api/ai/agents/runs');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.runs)).toBe(true);
  });
});

describe('GET /api/ai/agents/runs/:runId', () => {
  it('retourne 400 pour runId invalide (caracteres interdits)', async () => {
    const res = await request(app).get('/api/ai/agents/runs/run!invalid');
    expect(res.status).toBe(400);
  });

  it('retourne 404 pour runId inconnu', async () => {
    const res = await request(app).get('/api/ai/agents/runs/runid_inconnu_xyz');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/ai/agents/runs/clear', () => {
  it('refuse sans confirmation', async () => {
    const res = await request(app)
      .post('/api/ai/agents/runs/clear')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('confirmation_requise');
  });

  it('refuse avec mauvaise confirmation', async () => {
    const res = await request(app)
      .post('/api/ai/agents/runs/clear')
      .send({ confirmation: 'oui' });
    expect(res.status).toBe(400);
  });

  it('accepte avec confirmation correcte', async () => {
    const res = await request(app)
      .post('/api/ai/agents/runs/clear')
      .send({ confirmation: 'EFFACER_RUNS' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe('agentTypes — validateManifest', () => {
  it('valide un manifeste correct', () => {
    const result = validateManifest({
      id: 'test-agent', name: 'Test', tools: ['diagnostics.read'],
      localOnly: true, dryRun: true,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejette localOnly=false', () => {
    const result = validateManifest({
      id: 'bad', name: 'Bad', tools: [], localOnly: false, dryRun: true,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('localOnly_doit_etre_true');
  });

  it('rejette dryRun=false', () => {
    const result = validateManifest({
      id: 'bad', name: 'Bad', tools: [], localOnly: true, dryRun: false,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('dryRun_doit_etre_true');
  });
});

describe('agentSafety — isToolAllowed', () => {
  it('autorise les outils de la allowlist', () => {
    const result = isToolAllowed('diagnostics.read');
    expect(result.allowed).toBe(true);
  });

  it('refuse shell.execute', () => {
    const result = isToolAllowed('shell.execute');
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('outil_interdit');
  });

  it('refuse file.delete', () => {
    const result = isToolAllowed('file.delete');
    expect(result.allowed).toBe(false);
  });

  it('refuse restore.apply', () => {
    const result = isToolAllowed('restore.apply');
    expect(result.allowed).toBe(false);
  });

  it('refuse network.external', () => {
    const result = isToolAllowed('network.external');
    expect(result.allowed).toBe(false);
  });

  it('refuse secrets.read', () => {
    const result = isToolAllowed('secrets.read');
    expect(result.allowed).toBe(false);
  });

  it('refuse un outil non liste', () => {
    const result = isToolAllowed('anything.unknown');
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('outil_non_autorise');
  });

  it('getAgentSafety retourne localOnly=true', () => {
    const safety = getAgentSafety();
    expect(safety.localOnly).toBe(true);
    expect(safety.dryRunByDefault).toBe(true);
    expect(safety.noAutoExecution).toBe(true);
    expect(Array.isArray(safety.allowedTools)).toBe(true);
    expect(safety.forbiddenTools).toContain('shell.execute');
  });
});

describe('Securite — pas d\'appel cloud', () => {
  it('getAgentSafety.noCloudAllowed est true', () => {
    const safety = getAgentSafety();
    expect(safety.noCloudAllowed).toBe(true);
  });

  it('les agents integres ont tous localOnly=true', async () => {
    const res = await request(app).get('/api/ai/agents');
    for (const agent of res.body.agents) {
      expect(agent.localOnly).toBe(true);
    }
  });
});

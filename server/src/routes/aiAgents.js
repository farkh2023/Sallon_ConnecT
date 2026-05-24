'use strict';

const express = require('express');
const router  = express.Router();

const { orchestrate }          = require('../ai/agents/agentOrchestrator');
const { listAgents, getAgent } = require('../ai/agents/agentRegistry');
const { listRuns, getRun,
        clearRuns }            = require('../ai/agents/agentMemory');
const { validateAgentRequest,
        getAgentSafety }       = require('../ai/agents/agentSafety');
const { maskSecrets }          = require('../ai/aiSafety');
const bus                      = require('../services/serverEventBus');
const { getWorkspaceOptions }  = require('../workspaces/workspaceContext');

const AGENTS_ENABLED = () => process.env.SALLON_AGENTS_ENABLED === 'true';

function pub(type, severity, message) {
  try { bus.publish({ type, severity, source: 'agents', message }); } catch { /* non bloquant */ }
}

function workspaceScope(req, res) {
  try {
    return getWorkspaceOptions(req);
  } catch (err) {
    pub('workspace.isolation.violation.blocked', 'warning', err.message || 'workspace_invalide');
    res.status(err.message === 'workspace_introuvable' ? 404 : 400)
      .json({ ok: false, error: err.message || 'workspace_invalide' });
    return null;
  }
}

function opt(scope) {
  return scope.explicit ? scope.options : undefined;
}

function agentsDisabledResponse(res) {
  return res.status(503).json({
    ok: false,
    error: 'agents_disabled',
    message: 'Les agents IA sont desactives. Mettre SALLON_AGENTS_ENABLED=true dans .env.',
    safety: getAgentSafety(),
  });
}

/* -----------------------------------------------
   GET /api/ai/agents
----------------------------------------------- */
router.get('/', (req, res) => {
  const scope = workspaceScope(req, res);
  if (!scope) return;
  const agents = listAgents().map(a => ({
    id:          a.id,
    name:        a.name,
    description: a.description,
    model:       a.model,
    tools:       a.tools,
    permissions: a.permissions,
    enabled:     a.enabled,
    localOnly:   a.localOnly,
    dryRun:      a.dryRun,
  }));
  res.json({ workspaceId: scope.context.workspaceId, agents, total: agents.length, safety: getAgentSafety() });
});

/* -----------------------------------------------
   GET /api/ai/agents/runs  -- AVANT /:id
----------------------------------------------- */
router.get('/runs', (req, res) => {
  const scope = workspaceScope(req, res);
  if (!scope) return;
  const runs = opt(scope) ? listRuns(opt(scope)) : listRuns();
  res.json({ workspaceId: scope.context.workspaceId, runs, total: runs.length });
});

/* -----------------------------------------------
   GET /api/ai/agents/runs/:runId  -- AVANT /:id
----------------------------------------------- */
router.get('/runs/:runId', (req, res) => {
  const scope = workspaceScope(req, res);
  if (!scope) return;
  const { runId } = req.params;
  if (!runId || !/^[a-zA-Z0-9_-]+$/.test(runId)) {
    return res.status(400).json({ ok: false, error: 'runId_invalide' });
  }
  const run = opt(scope) ? getRun(runId, opt(scope)) : getRun(runId);
  if (!run) return res.status(404).json({ ok: false, error: 'run_introuvable' });
  res.json({ workspaceId: scope.context.workspaceId, ...run });
});

/* -----------------------------------------------
   POST /api/ai/agents/runs/clear  -- AVANT /:id
----------------------------------------------- */
router.post('/runs/clear', (req, res) => {
  const scope = workspaceScope(req, res);
  if (!scope) return;
  const { confirmation } = req.body || {};
  if (confirmation !== 'EFFACER_RUNS') {
    return res.status(400).json({
      ok: false,
      error: 'confirmation_requise',
      message: 'Envoyer { "confirmation": "EFFACER_RUNS" } pour confirmer.',
    });
  }
  const result = opt(scope) ? clearRuns(opt(scope)) : clearRuns();
  pub('agent.runs.cleared', 'warning', `${result.cleared} run(s) supprimes`);
  res.json({ ok: true, workspaceId: scope.context.workspaceId, cleared: result.cleared });
});

/* -----------------------------------------------
   POST /api/ai/agents/run
----------------------------------------------- */
router.post('/run', async (req, res) => {
  const scope = workspaceScope(req, res);
  if (!scope) return;
  if (!AGENTS_ENABLED()) return agentsDisabledResponse(res);

  const body = req.body || {};
  const validation = validateAgentRequest(body);
  if (!validation.valid) {
    return res.status(400).json({ ok: false, errors: validation.errors });
  }

  const {
    task,
    selectedAgents,
    useRag   = false,
    maxSteps,
    dryRun   = true,
  } = body;

  pub('agent.run.started', 'info', `Nouvelle run agents : "${maskSecrets(String(task)).slice(0, 80)}"`);

  try {
    const result = await orchestrate({
      task,
      selectedAgents: Array.isArray(selectedAgents) ? selectedAgents : undefined,
      useRag:   !!useRag,
      maxSteps: typeof maxSteps === 'number' ? maxSteps : undefined,
      dryRun:   dryRun !== false,
      workspaceId: scope.context.workspaceId,
    });
    pub('workspace.agent.run.created', 'success', `Run agents ${result.runId} cree`);
    res.json({ ok: true, ...result, workspaceId: scope.context.workspaceId });
  } catch (err) {
    pub('agent.run.failed', 'error', err.message);
    res.status(500).json({ ok: false, error: maskSecrets(err.message || 'erreur_orchestrateur') });
  }
});

/* -----------------------------------------------
   GET /api/ai/agents/:id
----------------------------------------------- */
router.get('/:id', (req, res) => {
  const scope = workspaceScope(req, res);
  if (!scope) return;
  const { id } = req.params;
  if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return res.status(400).json({ ok: false, error: 'id_invalide' });
  }
  const agent = getAgent(id);
  if (!agent) return res.status(404).json({ ok: false, error: 'agent_introuvable' });
  res.json({
    workspaceId:    scope.context.workspaceId,
    id:          agent.id,
    name:        agent.name,
    description: agent.description,
    model:       agent.model,
    tools:       agent.tools,
    permissions: agent.permissions,
    enabled:     agent.enabled,
    localOnly:   agent.localOnly,
    dryRun:      agent.dryRun,
    requiresCitations: agent.requiresCitations || false,
  });
});

module.exports = router;

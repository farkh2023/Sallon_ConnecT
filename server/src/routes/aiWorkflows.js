'use strict';

const express = require('express');
const router  = express.Router();

const { list, get, create, update, remove } = require('../ai/workflows/workflowRegistry');
const { runWorkflow }     = require('../ai/workflows/workflowRunner');
const { listRuns, getRun,
        clearRuns, exportWorkflow } = require('../ai/workflows/workflowStore');
const { listTemplates }   = require('../ai/workflows/workflowTemplates');
const { validateWorkflow } = require('../ai/workflows/workflowTypes');
const { validateImport,
        sanitizeWorkflowDefinition,
        getWorkflowSafety } = require('../ai/workflows/workflowSafety');
const { maskSecrets }     = require('../ai/aiSafety');
const bus                 = require('../services/serverEventBus');
const { getWorkspaceOptions } = require('../workspaces/workspaceContext');

const WF_ENABLED = () => process.env.SALLON_WORKFLOWS_ENABLED === 'true';

function pub(type, severity, message) {
  try { bus.publish({ type, severity, source: 'workflows', message }); } catch { /* non bloquant */ }
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

function wfDisabledResponse(res) {
  return res.status(503).json({
    ok: false, error: 'workflows_disabled',
    message: 'Mettre SALLON_WORKFLOWS_ENABLED=true dans .env.',
    safety: getWorkflowSafety(),
  });
}

function validId(id) {
  return typeof id === 'string' && /^[a-zA-Z0-9_-]+$/.test(id);
}

/* -----------------------------------------------
   GET /api/ai/workflows/templates
----------------------------------------------- */
router.get('/templates', (req, res) => {
  const scope = workspaceScope(req, res);
  if (!scope) return;
  res.json({ workspaceId: scope.context.workspaceId, templates: listTemplates(), total: listTemplates().length });
});

/* -----------------------------------------------
   GET /api/ai/workflows/runs  — AVANT /:id
----------------------------------------------- */
router.get('/runs', (req, res) => {
  const scope = workspaceScope(req, res);
  if (!scope) return;
  const runs = opt(scope) ? listRuns(opt(scope)) : listRuns();
  res.json({ workspaceId: scope.context.workspaceId, runs, total: runs.length });
});

/* -----------------------------------------------
   GET /api/ai/workflows/runs/:runId  — AVANT /:id
----------------------------------------------- */
router.get('/runs/:runId', (req, res) => {
  const scope = workspaceScope(req, res);
  if (!scope) return;
  const { runId } = req.params;
  if (!validId(runId)) return res.status(400).json({ ok: false, error: 'runId_invalide' });
  const run = opt(scope) ? getRun(runId, opt(scope)) : getRun(runId);
  if (!run) return res.status(404).json({ ok: false, error: 'run_introuvable' });
  res.json({ ...run, workspaceId: scope.context.workspaceId });
});

/* -----------------------------------------------
   POST /api/ai/workflows/runs/clear  — AVANT /:id
----------------------------------------------- */
router.post('/runs/clear', (req, res) => {
  const scope = workspaceScope(req, res);
  if (!scope) return;
  const { confirmation } = req.body || {};
  if (confirmation !== 'EFFACER_RUNS_WORKFLOWS') {
    return res.status(400).json({
      ok: false, error: 'confirmation_requise',
      message: 'Envoyer { "confirmation": "EFFACER_RUNS_WORKFLOWS" } pour confirmer.',
    });
  }
  const result = opt(scope) ? clearRuns(opt(scope)) : clearRuns();
  pub('workflow.runs.cleared', 'warning', `${result.cleared} run(s) supprimes`);
  res.json({ ok: true, workspaceId: scope.context.workspaceId, cleared: result.cleared });
});

/* -----------------------------------------------
   POST /api/ai/workflows/import
----------------------------------------------- */
router.post('/import', (req, res) => {
  const scope = workspaceScope(req, res);
  if (!scope) return;
  if (!WF_ENABLED()) return wfDisabledResponse(res);

  const raw = req.body;
  const imp = validateImport(raw);
  if (!imp.valid) return res.status(400).json({ ok: false, errors: imp.errors });

  const wf    = sanitizeWorkflowDefinition(raw);
  if (!wf) return res.status(400).json({ ok: false, errors: ['definition_invalide'] });

  const check = validateWorkflow(wf);
  if (!check.valid) return res.status(400).json({ ok: false, errors: check.errors });

  const result = opt(scope) ? create(wf, opt(scope)) : create(wf);
  if (!result.ok) return res.status(409).json({ ok: false, errors: result.errors });

  pub('workflow.created', 'success', `Workflow "${wf.name}" importe`);
  res.status(201).json({ ok: true, workspaceId: scope.context.workspaceId, id: wf.id });
});

/* -----------------------------------------------
   GET /api/ai/workflows
----------------------------------------------- */
router.get('/', (req, res) => {
  const scope = workspaceScope(req, res);
  if (!scope) return;
  const workflows = (opt(scope) ? list(opt(scope)) : list()).map(w => ({
    id: w.id, name: w.name, description: w.description, version: w.version,
    enabled: w.enabled, localOnly: w.localOnly, dryRun: w.dryRun,
    nodeCount: (w.nodes || []).length, _isTemplate: w._isTemplate || false,
  }));
  res.json({ workspaceId: scope.context.workspaceId, workflows, total: workflows.length, safety: getWorkflowSafety() });
});

/* -----------------------------------------------
   POST /api/ai/workflows
----------------------------------------------- */
router.post('/', (req, res) => {
  const scope = workspaceScope(req, res);
  if (!scope) return;
  if (!WF_ENABLED()) return wfDisabledResponse(res);

  const wf    = sanitizeWorkflowDefinition(req.body);
  if (!wf) return res.status(400).json({ ok: false, errors: ['definition_invalide'] });

  const check = validateWorkflow(wf);
  if (!check.valid) return res.status(400).json({ ok: false, errors: check.errors });

  const result = opt(scope) ? create(wf, opt(scope)) : create(wf);
  if (!result.ok) return res.status(409).json({ ok: false, errors: result.errors });

  pub('workflow.created', 'success', `Workflow "${wf.name}" cree`);
  res.status(201).json({ ok: true, workspaceId: scope.context.workspaceId, id: wf.id });
});

/* -----------------------------------------------
   GET /api/ai/workflows/:id
----------------------------------------------- */
router.get('/:id', (req, res) => {
  const scope = workspaceScope(req, res);
  if (!scope) return;
  const { id } = req.params;
  if (!validId(id)) return res.status(400).json({ ok: false, error: 'id_invalide' });
  const wf = opt(scope) ? get(id, opt(scope)) : get(id);
  if (!wf) return res.status(404).json({ ok: false, error: 'workflow_introuvable' });
  res.json({ ...wf, workspaceId: scope.context.workspaceId });
});

/* -----------------------------------------------
   PUT /api/ai/workflows/:id
----------------------------------------------- */
router.put('/:id', (req, res) => {
  const scope = workspaceScope(req, res);
  if (!scope) return;
  if (!WF_ENABLED()) return wfDisabledResponse(res);

  const { id } = req.params;
  if (!validId(id)) return res.status(400).json({ ok: false, error: 'id_invalide' });

  const result = opt(scope) ? update(id, req.body, opt(scope)) : update(id, req.body);
  if (!result.ok) return res.status(400).json({ ok: false, errors: result.errors });

  pub('workflow.updated', 'info', `Workflow "${id}" mis a jour`);
  res.json({ ok: true, workspaceId: scope.context.workspaceId, id });
});

/* -----------------------------------------------
   DELETE /api/ai/workflows/:id
----------------------------------------------- */
router.delete('/:id', (req, res) => {
  const scope = workspaceScope(req, res);
  if (!scope) return;
  if (!WF_ENABLED()) return wfDisabledResponse(res);

  const { id } = req.params;
  if (!validId(id)) return res.status(400).json({ ok: false, error: 'id_invalide' });

  const { confirmation } = req.body || {};
  if (confirmation !== 'SUPPRIMER') {
    return res.status(400).json({
      ok: false, error: 'confirmation_requise',
      message: 'Envoyer { "confirmation": "SUPPRIMER" } pour confirmer.',
    });
  }

  const deleted = opt(scope) ? remove(id, opt(scope)) : remove(id);
  if (!deleted) return res.status(404).json({ ok: false, error: 'workflow_introuvable' });

  pub('workflow.deleted', 'warning', `Workflow "${id}" supprime`);
  res.json({ ok: true, workspaceId: scope.context.workspaceId, deleted: true });
});

/* -----------------------------------------------
   POST /api/ai/workflows/:id/run
----------------------------------------------- */
router.post('/:id/run', async (req, res) => {
  const scope = workspaceScope(req, res);
  if (!scope) return;
  if (!WF_ENABLED()) return wfDisabledResponse(res);

  const { id } = req.params;
  if (!validId(id)) return res.status(400).json({ ok: false, error: 'id_invalide' });

  const wf = opt(scope) ? get(id, opt(scope)) : get(id);
  if (!wf) return res.status(404).json({ ok: false, error: 'workflow_introuvable' });
  if (!wf.enabled) return res.status(400).json({ ok: false, error: 'workflow_desactive' });

  pub('workflow.run.started', 'info', `Workflow "${wf.name}" (${id}) lance`);
  try {
    const result = await runWorkflow(wf, { dryRun: true, workspaceId: scope.context.workspaceId });
    pub('workspace.workflow.run.created', 'success', `Run workflow ${result.runId} cree`);
    res.json({ ok: true, ...result, workspaceId: scope.context.workspaceId });
  } catch (err) {
    pub('workflow.run.failed', 'error', err.message);
    res.status(500).json({ ok: false, error: maskSecrets(err.message || 'erreur_workflow') });
  }
});

/* -----------------------------------------------
   GET /api/ai/workflows/:id/export
----------------------------------------------- */
router.get('/:id/export', (req, res) => {
  const scope = workspaceScope(req, res);
  if (!scope) return;
  const { id } = req.params;
  if (!validId(id)) return res.status(400).json({ ok: false, error: 'id_invalide' });
  const wf = opt(scope) ? get(id, opt(scope)) : get(id);
  if (!wf) return res.status(404).json({ ok: false, error: 'workflow_introuvable' });
  const exported = opt(scope) ? exportWorkflow(wf, opt(scope)) : exportWorkflow(wf);
  res.json({ ok: true, workspaceId: scope.context.workspaceId, workflow: exported });
});

module.exports = router;

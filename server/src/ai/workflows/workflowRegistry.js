'use strict';

const { listWorkflows, getWorkflow, saveWorkflow, deleteWorkflow } = require('./workflowStore');
const { BUILT_IN_TEMPLATES } = require('./workflowTemplates');
const { validateWorkflow }    = require('./workflowTypes');
const { sanitizeWorkflowDefinition } = require('./workflowSafety');

// Charge les templates integres dans le store si absents
function _seedTemplates(options = {}) {
  const existing = listWorkflows(options).map(w => w.id);
  for (const t of BUILT_IN_TEMPLATES) {
    if (!existing.includes(t.id)) {
      saveWorkflow({ ...t, _isTemplate: true }, options);
    }
  }
}

try { _seedTemplates(); } catch { /* non bloquant */ }

function list(options = {}) {
  _seedTemplates(options);
  return listWorkflows(options);
}

function get(id, options = {}) {
  _seedTemplates(options);
  return getWorkflow(id, options);
}

function create(raw, options = {}) {
  const wf     = sanitizeWorkflowDefinition(raw);
  if (!wf) return { ok: false, errors: ['definition_invalide'] };

  const check  = validateWorkflow(wf);
  if (!check.valid) return { ok: false, errors: check.errors };

  // Verifier id unique
  if (getWorkflow(wf.id, options)) return { ok: false, errors: ['id_deja_utilise'] };

  saveWorkflow(wf, options);
  return { ok: true, id: wf.id };
}

function update(id, raw, options = {}) {
  const existing = getWorkflow(id, options);
  if (!existing) return { ok: false, errors: ['workflow_introuvable'] };

  const wf = sanitizeWorkflowDefinition({ ...raw, id });
  if (!wf) return { ok: false, errors: ['definition_invalide'] };

  const check = validateWorkflow(wf);
  if (!check.valid) return { ok: false, errors: check.errors };

  saveWorkflow({ ...wf, createdAt: existing.createdAt }, options);
  return { ok: true, id: wf.id };
}

function remove(id, options = {}) {
  return deleteWorkflow(id, options);
}

module.exports = { list, get, create, update, remove };

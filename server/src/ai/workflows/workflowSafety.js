'use strict';

const { FORBIDDEN_NODE_TYPES, MAX_NODES } = require('./workflowTypes');
const { maskSecrets } = require('../aiSafety');

const MAX_WORKFLOW_JSON_BYTES = 64 * 1024; // 64 Ko max par definition

function isNodeTypeAllowed(type) {
  if (FORBIDDEN_NODE_TYPES.has(type)) return { allowed: false, reason: 'type_noeud_interdit' };
  return { allowed: true, reason: null };
}

function sanitizeWorkflowOutput(text) {
  if (typeof text !== 'string') return '';
  return maskSecrets(text).slice(0, 5000);
}

function sanitizeWorkflowDefinition(wf) {
  if (!wf || typeof wf !== 'object') return null;
  // Masquer tout champ potentiellement sensible
  const safe = {
    id:          wf.id,
    name:        wf.name,
    description: wf.description ? String(wf.description).slice(0, 500) : '',
    version:     wf.version || '1.0.0',
    enabled:     wf.enabled === true,
    localOnly:   true,
    dryRun:      true,
    nodes:       (wf.nodes || []).slice(0, MAX_NODES),
    edges:       (wf.edges || []).slice(0, 100),
    triggers:    (wf.triggers || [{ type: 'manual' }]).slice(0, 5),
    createdAt:   wf.createdAt || new Date().toISOString(),
    updatedAt:   new Date().toISOString(),
  };
  return safe;
}

function validateImport(raw) {
  const errors = [];
  if (!raw || typeof raw !== 'object') {
    return { valid: false, errors: ['format_invalide'] };
  }
  if (JSON.stringify(raw).length > MAX_WORKFLOW_JSON_BYTES) {
    errors.push('workflow_trop_grand');
  }
  if (raw.localOnly === false) errors.push('localOnly_doit_etre_true');
  if (raw.dryRun === false) errors.push('dryRun_doit_etre_true');
  return { valid: errors.length === 0, errors };
}

function getWorkflowSafety() {
  return {
    localOnly:               true,
    noCloudAllowed:          true,
    noAutoExecution:         true,
    dryRunByDefault:         true,
    humanValidationRequired: true,
    secretMaskingEnabled:    true,
    maxNodes:                MAX_NODES,
    maxWorkflowJsonBytes:    MAX_WORKFLOW_JSON_BYTES,
    forbiddenNodeTypes:      Array.from(FORBIDDEN_NODE_TYPES),
  };
}

module.exports = {
  isNodeTypeAllowed,
  sanitizeWorkflowOutput,
  sanitizeWorkflowDefinition,
  validateImport,
  getWorkflowSafety,
};

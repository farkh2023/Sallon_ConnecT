'use strict';

const { maskSecrets } = require('../aiSafety');

// Outils autorises uniquement
const ALLOWED_TOOLS = new Set([
  'diagnostics.read',
  'rag.search',
  'rag.ask',
  'plugins.list',
  'backups.status',
  'updates.status',
  'service.status',
  'notifications.create',
  'commands.suggestSafe',
]);

// Outils explicitement interdits
const FORBIDDEN_TOOLS = new Set([
  'shell.execute',
  'file.delete',
  'restore.apply',
  'update.apply',
  'network.external',
  'secrets.read',
]);

const MAX_CONTEXT_CHARS = 8000;
const MAX_STEPS_DEFAULT = parseInt(process.env.SALLON_AGENTS_MAX_STEPS || '6', 10);

function isToolAllowed(toolName) {
  if (FORBIDDEN_TOOLS.has(toolName)) return { allowed: false, reason: 'outil_interdit' };
  if (!ALLOWED_TOOLS.has(toolName)) return { allowed: false, reason: 'outil_non_autorise' };
  return { allowed: true, reason: null };
}

function validateAgentRequest(body) {
  const errors = [];
  if (!body.task || typeof body.task !== 'string' || body.task.trim().length === 0) {
    errors.push('task_requis');
  }
  const maxSteps = typeof body.maxSteps === 'number' ? body.maxSteps : MAX_STEPS_DEFAULT;
  if (maxSteps < 1 || maxSteps > MAX_STEPS_DEFAULT) {
    errors.push(`maxSteps_doit_etre_entre_1_et_${MAX_STEPS_DEFAULT}`);
  }
  return { valid: errors.length === 0, errors };
}

function sanitizeContext(ctx) {
  if (typeof ctx !== 'string') return '';
  return maskSecrets(ctx).slice(0, MAX_CONTEXT_CHARS);
}

function sanitizeStep(step) {
  return {
    ...step,
    input:  step.input  ? maskSecrets(String(step.input)).slice(0, 2000)  : '',
    output: step.output ? maskSecrets(String(step.output)).slice(0, 4000) : '',
    error:  step.error  ? maskSecrets(String(step.error)).slice(0, 500)   : null,
  };
}

function getAgentSafety() {
  return {
    localOnly:              true,
    noCloudAllowed:         true,
    noAutoExecution:        true,
    dryRunByDefault:        true,
    humanValidationRequired: true,
    secretMaskingEnabled:   true,
    allowedTools:           Array.from(ALLOWED_TOOLS),
    forbiddenTools:         Array.from(FORBIDDEN_TOOLS),
    maxSteps:               MAX_STEPS_DEFAULT,
    maxContextChars:        MAX_CONTEXT_CHARS,
  };
}

module.exports = {
  isToolAllowed,
  validateAgentRequest,
  sanitizeContext,
  sanitizeStep,
  getAgentSafety,
  ALLOWED_TOOLS,
  FORBIDDEN_TOOLS,
  MAX_STEPS_DEFAULT,
};

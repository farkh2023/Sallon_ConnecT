'use strict';

const SEARCH_RESULT_TYPES = new Set([
  'knowledge', 'memory', 'rag', 'agent', 'workflow',
  'plugin', 'doc', 'diagnostic', 'command',
]);

const SAFE_ACTIONS = new Set([
  'open', 'copy', 'search.knowledge', 'search.memory', 'run-dry',
  'workspace.switch', 'workspace.export', 'workspace.create',
]);

const BLOCKED_ACTIONS = new Set([
  'shell.execute', 'restore.apply', 'update.apply',
  'delete', 'network.external', 'secrets.read',
]);

const MAX_HISTORY = () => parseInt(process.env.SALLON_SEARCH_HISTORY_MAX || '50', 10);
const TOP_K       = () => parseInt(process.env.SALLON_SEARCH_TOP_K       || '10', 10);
const MAX_QUERY   = 500;

function validateSearchQuery(query) {
  const errors = [];
  if (!query || typeof query !== 'string') errors.push('query_requise');
  else if (query.trim().length === 0)      errors.push('query_vide');
  else if (query.length > MAX_QUERY)       errors.push(`query_trop_longue_max_${MAX_QUERY}`);
  return { valid: errors.length === 0, errors };
}

module.exports = {
  SEARCH_RESULT_TYPES, SAFE_ACTIONS, BLOCKED_ACTIONS,
  MAX_HISTORY, TOP_K, MAX_QUERY, validateSearchQuery,
};

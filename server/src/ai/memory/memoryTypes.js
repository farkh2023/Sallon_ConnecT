'use strict';

const MEMORY_TYPES = new Set([
  'preference', 'fact', 'summary', 'workflow-result',
  'agent-result', 'diagnostic-insight', 'note',
]);

const MEMORY_SCOPES  = new Set(['user', 'project', 'system', 'session']);
const MEMORY_SOURCES = new Set(['chat', 'agent', 'workflow', 'manual', 'diagnostic']);

const MAX_ITEMS      = () => parseInt(process.env.SALLON_AI_MEMORY_MAX_ITEMS      || '1000', 10);
const MAX_ITEM_CHARS = () => parseInt(process.env.SALLON_AI_MEMORY_MAX_ITEM_CHARS || '4000', 10);
const RETENTION_DAYS = () => parseInt(process.env.SALLON_AI_MEMORY_RETENTION_DAYS || '90',   10);

function validateMemoryItem(item) {
  const errors = [];

  if (!item.type  || !MEMORY_TYPES.has(item.type))
    errors.push(`type_invalide: ${item.type}`);
  if (!item.scope || !MEMORY_SCOPES.has(item.scope))
    errors.push(`scope_invalide: ${item.scope}`);
  if (!item.content || typeof item.content !== 'string')
    errors.push('content_requis');
  if (item.content && item.content.length > MAX_ITEM_CHARS())
    errors.push(`content_trop_long_max_${MAX_ITEM_CHARS()}`);
  if (item.source && !MEMORY_SOURCES.has(item.source))
    errors.push(`source_invalide: ${item.source}`);
  if (item.tags && !Array.isArray(item.tags))
    errors.push('tags_doit_etre_tableau');
  if (item.importance !== undefined &&
      (typeof item.importance !== 'number' || item.importance < 0 || item.importance > 10))
    errors.push('importance_doit_etre_entre_0_et_10');

  return { valid: errors.length === 0, errors };
}

module.exports = {
  MEMORY_TYPES, MEMORY_SCOPES, MEMORY_SOURCES,
  MAX_ITEMS, MAX_ITEM_CHARS, RETENTION_DAYS,
  validateMemoryItem,
};

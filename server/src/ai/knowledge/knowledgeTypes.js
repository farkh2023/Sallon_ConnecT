'use strict';

const KB_ITEM_TYPES = new Set([
  'memory', 'rag', 'workflow', 'agent',
  'diagnostic', 'plugin', 'event', 'note',
]);

const KB_RELATION_TYPES = new Set([
  'related-to', 'derived-from', 'referenced-by',
  'causes', 'solves', 'extends', 'summarizes',
]);

const MAX_ITEMS    = () => parseInt(process.env.SALLON_KNOWLEDGE_MAX_ITEMS || '10000', 10);
const MAX_CONTENT  = 8000;
const MAX_TITLE    = 300;
const MAX_ENTITIES = 20;
const MAX_TAGS     = 30;
const DEFAULT_TOPK = () => parseInt(process.env.SALLON_KNOWLEDGE_TOP_K   || '8',     10);

function validateKbItem(item) {
  const errors = [];

  if (!item.id || typeof item.id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(item.id))
    errors.push('id_invalide');
  if (!item.type || !KB_ITEM_TYPES.has(item.type))
    errors.push(`type_invalide: ${item.type}`);
  if (!item.title || typeof item.title !== 'string' || item.title.length > MAX_TITLE)
    errors.push('title_requis_max_300');
  if (!item.content || typeof item.content !== 'string')
    errors.push('content_requis');
  if (item.content && item.content.length > MAX_CONTENT)
    errors.push(`content_trop_long_max_${MAX_CONTENT}`);
  if (item.entities && !Array.isArray(item.entities))
    errors.push('entities_doit_etre_tableau');
  if (item.tags && !Array.isArray(item.tags))
    errors.push('tags_doit_etre_tableau');
  if (item.relations && !Array.isArray(item.relations))
    errors.push('relations_doit_etre_tableau');

  return { valid: errors.length === 0, errors };
}

module.exports = {
  KB_ITEM_TYPES, KB_RELATION_TYPES,
  MAX_ITEMS, MAX_CONTENT, MAX_TITLE, MAX_ENTITIES, MAX_TAGS, DEFAULT_TOPK,
  validateKbItem,
};

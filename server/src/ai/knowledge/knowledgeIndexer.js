'use strict';

const store   = require('./knowledgeStore');
const { extractEntities } = require('./knowledgeEntities');

const INDEXABLE_SOURCES = ['memory', 'rag', 'workflow', 'agent', 'diagnostic', 'plugin', 'event', 'note'];

function buildTokens(text) {
  if (!text) return [];
  return text
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/\W+/)
    .filter(t => t.length > 2);
}

const _indexes = new Map();

function _key(options = {}) {
  try {
    return store._paths(options).workspaceId;
  } catch {
    return 'default';
  }
}

function getIndex(options = {}) {
  const key = _key(options);
  if (_indexes.has(key)) return _indexes.get(key);
  return rebuildIndex(options);
}

function rebuildIndex(options = {}) {
  const items = store.getAllItems(options);
  const index = new Map();
  for (const item of items) {
    if (!INDEXABLE_SOURCES.includes(item.type)) continue;
    const tokens = [
      ...buildTokens(item.title),
      ...buildTokens(item.content),
      ...(item.tags     || []).flatMap(t => buildTokens(t)),
      ...(item.entities || []).flatMap(e => buildTokens(e)),
      item.type,
    ];
    index.set(item.id, { item, tokens: [...new Set(tokens)] });
  }
  _indexes.set(_key(options), index);
  return index;
}

function invalidateIndex(options = {}) {
  if (options.workspaceId) _indexes.delete(_key(options));
  else _indexes.clear();
}

function indexItem(item, options = {}) {
  const idx = getIndex(options);
  const tokens = [
    ...buildTokens(item.title),
    ...buildTokens(item.content),
    ...(item.tags     || []).flatMap(t => buildTokens(t)),
    ...(item.entities || []).flatMap(e => buildTokens(e)),
    item.type,
  ];
  idx.set(item.id, { item, tokens: [...new Set(tokens)] });
}

function enrichWithEntities(item) {
  const extracted = extractEntities(`${item.title || ''} ${item.content || ''}`);
  const merged    = [...new Set([...(item.entities || []), ...extracted])];
  return { ...item, entities: merged };
}

module.exports = { buildTokens, getIndex, rebuildIndex, invalidateIndex, indexItem, enrichWithEntities };

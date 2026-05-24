'use strict';

const fs   = require('fs');
const path = require('path');
const { sanitizeKbItem } = require('./knowledgeSafety');
const { validateKbItem, MAX_ITEMS } = require('./knowledgeTypes');
const workspaceContext = require('../../workspaces/workspaceContext');

const _cache = new Map();

function _paths(options = {}) {
  const dir = workspaceContext.getKnowledgePath(options.workspaceId);
  return {
    workspaceId: workspaceContext.getContextPaths(options.workspaceId).workspaceId,
    storeDir: dir,
    itemsFile: path.join(dir, 'items.json'),
    metaFile:  path.join(dir, 'metadata.json'),
  };
}

function _ensureDir(options = {}) {
  const { storeDir } = _paths(options);
  if (!fs.existsSync(storeDir)) fs.mkdirSync(storeDir, { recursive: true });
}

function _load(options = {}) {
  const paths = _paths(options);
  if (_cache.has(paths.workspaceId)) return _cache.get(paths.workspaceId);
  _ensureDir(options);
  if (!fs.existsSync(paths.itemsFile)) {
    const empty = new Map();
    _cache.set(paths.workspaceId, empty);
    return empty;
  }
  try {
    const raw = JSON.parse(fs.readFileSync(paths.itemsFile, 'utf8'));
    const loaded = new Map(raw.map(i => [i.id, i]));
    _cache.set(paths.workspaceId, loaded);
    return loaded;
  } catch {
    const empty = new Map();
    _cache.set(paths.workspaceId, empty);
    return empty;
  }
}

function _persist(items, options = {}) {
  const paths = _paths(options);
  _ensureDir(options);
  const arr = [...items.values()];
  fs.writeFileSync(paths.itemsFile, JSON.stringify(arr, null, 2), 'utf8');
  const meta = _buildMeta(arr);
  fs.writeFileSync(paths.metaFile, JSON.stringify({ ...meta, workspaceId: paths.workspaceId }, null, 2), 'utf8');
  return meta;
}

function _buildMeta(arr) {
  const byType = {};
  const bySource = {};
  for (const item of arr) {
    byType[item.type]     = (byType[item.type]     || 0) + 1;
    bySource[item.sourceId || 'unknown'] = (bySource[item.sourceId || 'unknown'] || 0) + 1;
  }
  return { totalItems: arr.length, byType, bySource, updatedAt: new Date().toISOString() };
}

function listItems(filters = {}, options = {}) {
  const items = [..._load(options).values()];
  return items.filter(i => {
    if (filters.type   && i.type   !== filters.type)   return false;
    if (filters.source && i.sourceId !== filters.source) return false;
    if (filters.tag    && !(i.tags || []).includes(filters.tag)) return false;
    if (filters.entity && !(i.entities || []).includes(filters.entity)) return false;
    return true;
  });
}

function getItem(id, options = {}) {
  return _load(options).get(id) || null;
}

function createItem(item, options = {}) {
  const items = _load(options);
  if (items.size >= MAX_ITEMS()) throw new Error('knowledge_max_items_reached');
  const v = validateKbItem(item);
  if (!v.valid) throw new Error(`validation: ${v.errors.join(', ')}`);
  const workspaceId = _paths(options).workspaceId;
  const safe = sanitizeKbItem({ ...item, workspaceId, localOnly: true, updatedAt: new Date().toISOString() });
  items.set(safe.id, safe);
  _cache.set(workspaceId, items);
  _persist(items, options);
  return safe;
}

function updateItem(id, updates, options = {}) {
  const items = _load(options);
  const existing = items.get(id);
  if (!existing) return null;
  const workspaceId = _paths(options).workspaceId;
  const merged = { ...existing, ...updates, id, workspaceId, updatedAt: new Date().toISOString(), localOnly: true };
  const v = validateKbItem(merged);
  if (!v.valid) throw new Error(`validation: ${v.errors.join(', ')}`);
  const safe = sanitizeKbItem(merged);
  items.set(id, safe);
  _cache.set(workspaceId, items);
  _persist(items, options);
  return safe;
}

function deleteItem(id, options = {}) {
  const items = _load(options);
  const existed = items.has(id);
  if (existed) {
    items.delete(id);
    _cache.set(_paths(options).workspaceId, items);
    _persist(items, options);
  }
  return existed;
}

function clearItems(options = {}) {
  _ensureDir(options);
  const empty = new Map();
  _cache.set(_paths(options).workspaceId, empty);
  _persist(empty, options);
}

function getMeta(options = {}) {
  const paths = _paths(options);
  if (fs.existsSync(paths.metaFile)) {
    try { return JSON.parse(fs.readFileSync(paths.metaFile, 'utf8')); } catch {}
  }
  return { ..._buildMeta([..._load(options).values()]), workspaceId: paths.workspaceId };
}

function getAllItems(options = {}) {
  return [..._load(options).values()];
}

function invalidateCache(options = {}) {
  if (options.workspaceId) _cache.delete(_paths(options).workspaceId);
  else _cache.clear();
}

module.exports = { listItems, getItem, createItem, updateItem, deleteItem, clearItems, getMeta, getAllItems, invalidateCache, _paths };

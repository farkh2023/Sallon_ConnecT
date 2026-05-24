'use strict';

const path = require('path');
const fs   = require('fs');
const { MAX_ITEMS } = require('./memoryTypes');

function _memoryDir(options = {}) {
  try {
    const workspaceContext = require('../../workspaces/workspaceContext');
    return options.workspaceId
      ? workspaceContext.getContextPaths(options.workspaceId).memory
      : workspaceContext.getCurrentContext().memory;
  } catch {
    return path.join(process.cwd(), 'runtime', 'ai-memory');
  }
}

function _paths(options = {}) {
  const dir = _memoryDir(options);
  return {
    dir,
    memFile:   path.join(dir, 'memory.json'),
    indexFile: path.join(dir, 'index.json'),
    metaFile:  path.join(dir, 'metadata.json'),
    exports:   path.join(dir, 'exports'),
  };
}

function _ensureDirs(options = {}) {
  const p = _paths(options);
  const dirs = [p.dir, p.exports];
  for (const d of dirs) {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  }
}

function _load(options = {}) {
  _ensureDirs(options);
  const p = _paths(options);
  if (!fs.existsSync(p.memFile)) return [];
  try { return JSON.parse(fs.readFileSync(p.memFile, 'utf8')) || []; }
  catch { return []; }
}

function _updateIndex(items, options = {}) {
  const index = items.map(i => ({
    id: i.id, type: i.type, scope: i.scope, source: i.source,
    tags: i.tags, importance: i.importance, createdAt: i.createdAt,
    snippet: (i.content || '').slice(0, 120),
  }));
  try { fs.writeFileSync(_paths(options).indexFile, JSON.stringify(index, null, 2), 'utf8'); } catch { /* non bloquant */ }
}

function _updateMeta(items, options = {}) {
  const meta = { totalItems: items.length, byType: {}, byScope: {}, updatedAt: new Date().toISOString() };
  for (const item of items) {
    meta.byType[item.type]   = (meta.byType[item.type]   || 0) + 1;
    meta.byScope[item.scope] = (meta.byScope[item.scope] || 0) + 1;
  }
  try { fs.writeFileSync(_paths(options).metaFile, JSON.stringify(meta, null, 2), 'utf8'); } catch { /* non bloquant */ }
}

function _persist(items, options = {}) {
  fs.writeFileSync(_paths(options).memFile, JSON.stringify(items, null, 2), 'utf8');
  _updateIndex(items, options);
  _updateMeta(items, options);
  try { require('../../search/globalSearchIndexer').invalidateIndex(); } catch { /* non bloquant */ }
}

// ── Public API ────────────────────────────────────────────────────────────────

function listItems(filters = {}, options = {}) {
  let items = _load(options);
  if (filters.type)   items = items.filter(i => i.type   === filters.type);
  if (filters.scope)  items = items.filter(i => i.scope  === filters.scope);
  if (filters.source) items = items.filter(i => i.source === filters.source);
  if (Array.isArray(filters.tags) && filters.tags.length > 0) {
    items = items.filter(i => filters.tags.some(t => (i.tags || []).includes(t)));
  }
  return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getItem(id, options = {}) {
  const items = _load(options);
  const idx   = items.findIndex(i => i.id === id);
  if (idx === -1) return null;
  items[idx].lastAccessedAt = new Date().toISOString();
  _persist(items, options);
  return items[idx];
}

function createItem(item, options = {}) {
  const items = _load(options);
  if (items.length >= MAX_ITEMS()) return { ok: false, error: `max_items_atteint_${MAX_ITEMS()}` };
  if (items.find(i => i.id === item.id)) return { ok: false, error: 'id_deja_existant' };
  items.push({ ...item, workspaceId: options.workspaceId || item.workspaceId });
  _persist(items, options);
  return { ok: true, id: item.id };
}

function updateItem(id, updates, options = {}) {
  const items = _load(options);
  const idx   = items.findIndex(i => i.id === id);
  if (idx === -1) return { ok: false, error: 'item_introuvable' };
  items[idx] = { ...items[idx], ...updates, id, updatedAt: new Date().toISOString() };
  _persist(items, options);
  return { ok: true };
}

function deleteItem(id, options = {}) {
  const items = _load(options);
  const idx   = items.findIndex(i => i.id === id);
  if (idx === -1) return false;
  items.splice(idx, 1);
  _persist(items, options);
  return true;
}

function clearItems(options = {}) {
  const items = _load(options);
  const count = items.length;
  _persist([], options);
  return { cleared: count };
}

function getMeta(options = {}) {
  _ensureDirs(options);
  const p = _paths(options);
  if (!fs.existsSync(p.metaFile)) return { totalItems: 0, byType: {}, byScope: {}, updatedAt: null };
  try { return JSON.parse(fs.readFileSync(p.metaFile, 'utf8')); }
  catch { return { totalItems: 0, byType: {}, byScope: {}, updatedAt: null }; }
}

function getAllItems(options = {}) {
  return _load(options);
}

module.exports = {
  listItems, getItem, createItem, updateItem,
  deleteItem, clearItems, getMeta, getAllItems,
};

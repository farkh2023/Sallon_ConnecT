'use strict';

const { maskSecrets } = require('./globalSearchSafety');
const { getAllCommands } = require('./commandRegistry');
const workspaceContext = require('../workspaces/workspaceContext');

function tokenize(text) {
  if (!text) return [];
  return text
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/\W+/)
    .filter(t => t.length > 2);
}

function makeResultId(prefix, id) {
  return `result_${prefix}_${id}`;
}

const _indexes = new Map();

function workspaceKey(options = {}) {
  try { return workspaceContext.getContextPaths(options.workspaceId).workspaceId; }
  catch { return 'default'; }
}

function buildCommandEntries() {
  return getAllCommands().map(cmd => ({
    id:          makeResultId('cmd', cmd.id),
    type:        'command',
    title:       cmd.title,
    description: cmd.description,
    score:       1,
    source:      'command-registry',
    target:      cmd.target,
    tags:        cmd.tags,
    actions:     cmd.actions,
    localOnly:   true,
    _commandId:  cmd.id,
    _tokens:     [...new Set([...tokenize(cmd.title), ...tokenize(cmd.description), ...cmd.tags.flatMap(t => tokenize(t))])],
  }));
}

function buildKnowledgeEntries(options = {}) {
  try {
    const store = require('../ai/knowledge/knowledgeStore');
    return store.getAllItems(options).map(item => ({
      id:          makeResultId('kb', item.id),
      type:        'knowledge',
      title:       maskSecrets(item.title),
      description: maskSecrets((item.content || '').slice(0, 200)),
      score:       (item.importance || 1) * 0.1,
      source:      'knowledge-base',
      target:      null,
      tags:        item.tags || [],
      actions:     ['open', 'copy'],
      localOnly:   true,
      _sourceId:   item.id,
      _tokens:     [...new Set([...tokenize(item.title), ...tokenize(item.content), ...(item.tags || []).flatMap(t => tokenize(t))])],
    }));
  } catch { return []; }
}

function buildMemoryEntries(options = {}) {
  try {
    const store = require('../ai/memory/memoryStore');
    return store.listItems({}, options).map(item => ({
      id:          makeResultId('mem', item.id),
      type:        'memory',
      title:       maskSecrets(item.content ? item.content.slice(0, 80) : item.type),
      description: maskSecrets((item.content || '').slice(0, 200)),
      score:       (item.importance || 1) * 0.1,
      source:      'ai-memory',
      target:      null,
      tags:        item.tags || [],
      actions:     ['open', 'copy'],
      localOnly:   true,
      _sourceId:   item.id,
      _tokens:     [...new Set([...tokenize(item.content), ...(item.tags || []).flatMap(t => tokenize(t)), item.type])],
    }));
  } catch { return []; }
}

function getIndex(options = {}) {
  const key = workspaceKey(options);
  if (_indexes.has(key)) return _indexes.get(key);
  return rebuildIndex(options);
}

function rebuildIndex(options = {}) {
  const entries = [
    ...buildCommandEntries(),
    ...buildKnowledgeEntries(options),
    ...buildMemoryEntries(options),
  ];
  _indexes.set(workspaceKey(options), entries);
  return entries;
}

function invalidateIndex(options = {}) {
  if (options.workspaceId) _indexes.delete(workspaceKey(options));
  else _indexes.clear();
}

module.exports = { tokenize, getIndex, rebuildIndex, invalidateIndex };

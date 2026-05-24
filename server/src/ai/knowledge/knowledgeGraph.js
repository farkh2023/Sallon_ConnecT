'use strict';

const store    = require('./knowledgeStore');
const { autoLinkByEntities } = require('./knowledgeRelations');

function buildGraph(filters = {}, options = {}) {
  const items = store.listItems(filters, options);

  const nodes = items.map(item => ({
    id:         item.id,
    type:       item.type,
    title:      item.title,
    entities:   item.entities || [],
    tags:       item.tags     || [],
    importance: item.importance || 1,
  }));

  const edgeSet = new Set();
  const edges   = [];

  for (const item of items) {
    for (const rel of (item.relations || [])) {
      const key = `${item.id}|${rel.targetId}|${rel.type}`;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push({ source: item.id, target: rel.targetId, type: rel.type });
      }
    }
  }

  return {
    nodes,
    edges,
    totalNodes: nodes.length,
    totalEdges: edges.length,
    generatedAt: new Date().toISOString(),
  };
}

function linkEntities(options = {}) {
  const items = store.getAllItems(options);
  const added = autoLinkByEntities(items);
  store.invalidateCache(options);
  return { linked: added.length, relations: added };
}

function getNeighbours(id, depth = 1, options = {}) {
  const visited = new Set();
  const result  = [];

  function traverse(currentId, d) {
    if (d < 0 || visited.has(currentId)) return;
    visited.add(currentId);
    const item = store.getItem(currentId, options);
    if (!item) return;
    result.push(item);
    if (d === 0) return;
    for (const rel of (item.relations || [])) traverse(rel.targetId, d - 1);
  }

  traverse(id, depth);
  return result;
}

module.exports = { buildGraph, linkEntities, getNeighbours };

'use strict';

const { KB_RELATION_TYPES } = require('./knowledgeTypes');
const store = require('./knowledgeStore');

function validateRelation(rel) {
  if (!rel || typeof rel !== 'object') return false;
  if (!rel.targetId || typeof rel.targetId !== 'string') return false;
  if (!KB_RELATION_TYPES.has(rel.type)) return false;
  return true;
}

function addRelation(sourceId, relation) {
  const item = store.getItem(sourceId);
  if (!item) return null;
  if (!validateRelation(relation)) throw new Error('relation_invalide');
  const relations = [...(item.relations || [])];
  const exists = relations.find(r => r.targetId === relation.targetId && r.type === relation.type);
  if (exists) return item;
  relations.push({ ...relation, createdAt: new Date().toISOString() });
  return store.updateItem(sourceId, { relations });
}

function removeRelation(sourceId, targetId, type) {
  const item = store.getItem(sourceId);
  if (!item) return null;
  const relations = (item.relations || []).filter(r => !(r.targetId === targetId && r.type === type));
  return store.updateItem(sourceId, { relations });
}

function getRelations(id) {
  const item = store.getItem(id);
  if (!item) return [];
  return item.relations || [];
}

function getIncomingRelations(targetId) {
  const all = store.getAllItems();
  const incoming = [];
  for (const item of all) {
    const rels = (item.relations || []).filter(r => r.targetId === targetId);
    for (const r of rels) incoming.push({ sourceId: item.id, ...r });
  }
  return incoming;
}

function autoLinkByEntities(items) {
  const added = [];
  for (const item of items) {
    const myEntities = new Set(item.entities || []);
    if (myEntities.size === 0) continue;
    for (const other of items) {
      if (other.id === item.id) continue;
      const otherEntities = other.entities || [];
      const shared = otherEntities.filter(e => myEntities.has(e));
      if (shared.length > 0) {
        try {
          addRelation(item.id, { targetId: other.id, type: 'related-to' });
          added.push({ from: item.id, to: other.id, type: 'related-to' });
        } catch {}
      }
    }
  }
  return added;
}

module.exports = { validateRelation, addRelation, removeRelation, getRelations, getIncomingRelations, autoLinkByEntities };

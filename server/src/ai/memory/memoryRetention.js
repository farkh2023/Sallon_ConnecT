'use strict';

const { getAllItems, deleteItem, getMeta } = require('./memoryStore');
const { MAX_ITEMS, RETENTION_DAYS }        = require('./memoryTypes');

const HIGH_IMPORTANCE_THRESHOLD = 8;

function purgeExpired() {
  const items  = getAllItems();
  const now    = Date.now();
  let   purged = 0;

  for (const item of items) {
    if (item.expiresAt && new Date(item.expiresAt).getTime() < now) {
      deleteItem(item.id);
      purged++;
    }
  }
  return { purged, reason: 'expired' };
}

function purgeByAge(maxDays) {
  const days   = maxDays ?? RETENTION_DAYS();
  const cutoff = Date.now() - days * 86400000;
  const items  = getAllItems();
  let   purged = 0;

  for (const item of items) {
    if ((item.importance || 0) >= HIGH_IMPORTANCE_THRESHOLD) continue;
    if (new Date(item.createdAt || 0).getTime() < cutoff) {
      deleteItem(item.id);
      purged++;
    }
  }
  return { purged, reason: 'age', maxDays: days };
}

function purgeByType(type) {
  const items  = getAllItems();
  let   purged = 0;
  for (const item of items) {
    if (item.type === type) { deleteItem(item.id); purged++; }
  }
  return { purged, reason: 'type', type };
}

function enforceMaxItems() {
  const items = getAllItems();
  const max   = MAX_ITEMS();
  if (items.length <= max) return { purged: 0 };

  const sorted = [...items].sort((a, b) => {
    const diff = (a.importance || 0) - (b.importance || 0);
    return diff !== 0 ? diff : new Date(a.createdAt) - new Date(b.createdAt);
  });

  const toDelete = sorted.slice(0, items.length - max);
  for (const item of toDelete) deleteItem(item.id);
  return { purged: toDelete.length };
}

function getRetentionStatus() {
  const meta = getMeta();
  return {
    totalItems:    meta.totalItems    || 0,
    maxItems:      MAX_ITEMS(),
    retentionDays: RETENTION_DAYS(),
    byType:        meta.byType  || {},
    byScope:       meta.byScope || {},
  };
}

module.exports = {
  purgeExpired, purgeByAge, purgeByType,
  enforceMaxItems, getRetentionStatus,
};

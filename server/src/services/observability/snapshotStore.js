'use strict';

const fs = require('fs');
const path = require('path');

const ENABLED = process.env.OBSERVABILITY_SNAPSHOTS_ENABLED !== 'false';
const SNAPSHOTS_PATH = path.resolve(
  process.env.OBSERVABILITY_SNAPSHOTS_PATH || 'runtime/observability-snapshots.json'
);
const MAX_ITEMS = parseInt(process.env.OBSERVABILITY_SNAPSHOTS_MAX_ITEMS || '200', 10);

function _read() {
  try {
    const raw = fs.readFileSync(SNAPSHOTS_PATH, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function _write(items) {
  try {
    fs.writeFileSync(SNAPSHOTS_PATH, JSON.stringify(items, null, 2), 'utf8');
  } catch { /* Silencieux */ }
}

function loadSnapshots() {
  if (!ENABLED) return [];
  return _read();
}

function saveSnapshots(items) {
  if (!ENABLED) return;
  _write(items);
}

function addSnapshot(snapshot) {
  if (!ENABLED) return snapshot;
  const items = _read();
  items.unshift(snapshot);
  _write(items.slice(0, MAX_ITEMS));
  return snapshot;
}

function listSnapshots(filters = {}) {
  let items = loadSnapshots();
  if (filters.source) items = items.filter(s => s.source === filters.source);
  if (filters.status) items = items.filter(s => s.status === filters.status);
  const limit = filters.limit ? Math.min(parseInt(filters.limit, 10), MAX_ITEMS) : MAX_ITEMS;
  return items.slice(0, limit);
}

function getLatestSnapshot() {
  const items = loadSnapshots();
  return items[0] || null;
}

function clearSnapshots() {
  const items = loadSnapshots();
  const count = items.length;
  _write([]);
  return { cleared: count };
}

function getSnapshotStats() {
  const items = loadSnapshots();
  const total = items.length;
  const okCount = items.filter(s => s.status === 'ok').length;
  const warningCount = items.filter(s => s.status === 'warning').length;
  const errorCount = items.filter(s => s.status === 'error').length;
  const latest = items[0] || null;

  let statusChanges = 0;
  for (let i = 1; i < items.length; i++) {
    if (items[i - 1].status !== items[i].status) statusChanges++;
  }

  const counts = { ok: okCount, warning: warningCount, error: errorCount };
  const mostCommonStatus = total > 0
    ? Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
    : null;

  return {
    total,
    okCount,
    warningCount,
    errorCount,
    lastStatus: latest ? latest.status : null,
    lastCreatedAt: latest ? latest.createdAt : null,
    statusChanges,
    mostCommonStatus,
  };
}

module.exports = {
  loadSnapshots,
  saveSnapshots,
  addSnapshot,
  listSnapshots,
  getLatestSnapshot,
  clearSnapshots,
  getSnapshotStats,
};

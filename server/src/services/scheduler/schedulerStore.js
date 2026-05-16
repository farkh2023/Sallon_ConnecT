'use strict';
/* =============================================
   schedulerStore.js — Phase 13
   Persistance locale des tâches planifiées.
   Jamais de donnée sensible stockée.
============================================= */

const fs   = require('fs');
const path = require('path');

const SCHEDULES_PATH = path.resolve(
  process.env.SCHEDULER_STORE_PATH || 'runtime/schedules.json'
);
const HISTORY_PATH = path.resolve(
  process.env.SCHEDULER_HISTORY_PATH || 'runtime/schedule-history.json'
);
const MAX_HISTORY = parseInt(process.env.SCHEDULER_MAX_HISTORY || '200', 10);

/* ── Helpers I/O ──────────────────────────── */

function _read(filePath, fallback) {
  try {
    const raw  = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : fallback;
  } catch {
    return fallback;
  }
}

function _write(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch { /* Silencieux */ }
}

function _genId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
}

/* ═══════════════════════════════════════════
   SCHEDULES
═══════════════════════════════════════════ */

function loadSchedules() {
  return _read(SCHEDULES_PATH, []);
}

function saveSchedules(items) {
  _write(SCHEDULES_PATH, items);
}

function getScheduleById(id) {
  return loadSchedules().find(s => s.id === id) || null;
}

function createSchedule(input) {
  const now = new Date().toISOString();
  const schedule = {
    id:          _genId('schedule'),
    name:        String(input.name || 'Tâche').trim().substring(0, 100),
    description: String(input.description || '').substring(0, 300),
    actionType:  input.actionType,
    enabled:     input.enabled !== false,
    schedule:    input.schedule || { type: 'manual' },
    lastRunAt:   null,
    nextRunAt:   null,
    createdAt:   now,
    updatedAt:   now,
    source:      'Sallon-ConnecT',
  };
  const items = loadSchedules();
  items.push(schedule);
  saveSchedules(items);
  return schedule;
}

function updateSchedule(id, patch) {
  const items = loadSchedules();
  const idx   = items.findIndex(s => s.id === id);
  if (idx === -1) return null;
  const allowed = ['name', 'description', 'enabled', 'schedule', 'nextRunAt', 'lastRunAt', 'updatedAt'];
  for (const key of allowed) {
    if (patch[key] !== undefined) items[idx][key] = patch[key];
  }
  items[idx].updatedAt = new Date().toISOString();
  saveSchedules(items);
  return items[idx];
}

function deleteSchedule(id) {
  const items  = loadSchedules();
  const before = items.length;
  const next   = items.filter(s => s.id !== id);
  if (next.length === before) return false;
  saveSchedules(next);
  return true;
}

function listSchedules(filters = {}) {
  let items = loadSchedules();
  if (filters.enabled !== undefined) items = items.filter(s => s.enabled === filters.enabled);
  if (filters.actionType)            items = items.filter(s => s.actionType === filters.actionType);
  return items;
}

/* ═══════════════════════════════════════════
   HISTORY
═══════════════════════════════════════════ */

function loadHistory() {
  return _read(HISTORY_PATH, []);
}

function appendHistory(run) {
  const history = loadHistory();
  history.unshift(run);
  _write(HISTORY_PATH, history.slice(0, MAX_HISTORY));
}

function clearHistory() {
  const count = loadHistory().length;
  _write(HISTORY_PATH, []);
  return { cleared: count };
}

function getHistory(limit = 50) {
  return loadHistory().slice(0, limit);
}

function createHistoryEntry(scheduleId, scheduleName, actionType) {
  return {
    id:           _genId('run'),
    scheduleId,
    scheduleName,
    actionType,
    startedAt:    new Date().toISOString(),
    finishedAt:   null,
    status:       'running',
    durationMs:   null,
    message:      null,
    safe:         true,
    notificationId: null,
  };
}

function finalizeHistoryEntry(entry, status, message, notificationId = null) {
  const finishedAt = new Date().toISOString();
  const updated = {
    ...entry,
    finishedAt,
    status,
    durationMs: new Date(finishedAt).getTime() - new Date(entry.startedAt).getTime(),
    message:    String(message || '').substring(0, 300),
    notificationId,
  };
  appendHistory(updated);
  return updated;
}

module.exports = {
  loadSchedules,
  saveSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  listSchedules,
  loadHistory,
  appendHistory,
  clearHistory,
  getHistory,
  createHistoryEntry,
  finalizeHistoryEntry,
};

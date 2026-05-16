'use strict';
/* =============================================
   notificationEngine.js — Phase 12
   Moteur de notifications locales sécurisé.
   Jamais de push cloud, Firebase, email, SMS.
   Déduplication anti-spam intégrée.
============================================= */

const safety = require('./notificationSafety');
const store  = require('./notificationStore');

const ENABLED          = process.env.NOTIFICATIONS_ENABLED !== 'false';
const DEDUP_WINDOW_MS  = parseInt(process.env.NOTIFICATIONS_DEDUP_WINDOW_MS || '30000', 10);

/* Cache de déduplication en mémoire (non persisté) */
const _dedupCache = new Map(); // key → timestamp

function _generateId() {
  return `notif-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/* ── deduplicateNotification ─────────────── */
function deduplicateNotification(notification) {
  const key = `${notification.type}|${notification.level}|${notification.title}`;
  const now  = Date.now();
  const last = _dedupCache.get(key);
  if (last && (now - last) < DEDUP_WINDOW_MS) {
    return false; // dupliqué
  }
  _dedupCache.set(key, now);
  /* Nettoyer les entrées trop anciennes */
  for (const [k, t] of _dedupCache.entries()) {
    if (now - t > DEDUP_WINDOW_MS * 2) _dedupCache.delete(k);
  }
  return true;
}

/* ── notify (cœur) ───────────────────────── */
function notify(input) {
  if (!ENABLED) return null;

  const safe = safety.buildSafeNotification(input);

  const notification = {
    id:                  _generateId(),
    type:                safe.type,
    level:               safe.level,
    title:               safe.title,
    message:             safe.message,
    createdAt:           new Date().toISOString(),
    read:                false,
    source:              'Sallon-ConnecT',
    meta:                safe.meta,
    sensitiveDataMasked: true,
  };

  if (!deduplicateNotification(notification)) return null;

  return store.addNotification(notification);
}

/* ── Helpers par niveau ──────────────────── */
function notifyInfo(title, message, meta = {}) {
  return notify({ type: 'system', level: 'info', title, message, meta });
}

function notifySuccess(title, message, meta = {}) {
  return notify({ type: 'system', level: 'success', title, message, meta });
}

function notifyWarning(title, message, meta = {}) {
  return notify({ type: 'system', level: 'warning', title, message, meta });
}

function notifyError(title, message, meta = {}) {
  return notify({ type: 'system', level: 'error', title, message, meta });
}

function notifySecurity(title, message, meta = {}) {
  return notify({ type: 'security', level: 'security', title, message, meta });
}

/* ── emitSystemEvent ─────────────────────── */
function emitSystemEvent(event) {
  if (!event || !event.type) return null;

  const levelMap = {
    start:      'info',
    success:    'success',
    complete:   'success',
    warning:    'warning',
    error:      'error',
    refused:    'warning',
    blocked:    'warning',
    security:   'security',
    violation:  'security',
    available:  'success',
    unavailable:'warning',
    unauthorized:'error',
  };

  const level = levelMap[event.status] || 'info';
  return notify({
    type:    event.notifType || 'system',
    level,
    title:   event.title   || 'Événement système',
    message: event.message || '',
    meta:    event.meta    || {},
  });
}

module.exports = {
  notify,
  notifyInfo,
  notifySuccess,
  notifyWarning,
  notifyError,
  notifySecurity,
  deduplicateNotification,
  emitSystemEvent,
};

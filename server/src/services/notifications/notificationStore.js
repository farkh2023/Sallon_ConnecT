'use strict';
/* =============================================
   notificationStore.js — Phase 12
   Persistance des notifications locales.
   runtime/notifications.json — jamais cloud.
============================================= */

const fs   = require('fs');
const path = require('path');

const STORE_PATH = path.resolve(process.env.NOTIFICATIONS_STORE_PATH || 'runtime/notifications.json');
const MAX_ITEMS  = parseInt(process.env.NOTIFICATIONS_MAX_ITEMS || '200', 10);
const AUTO_CLEANUP_DAYS = parseInt(process.env.NOTIFICATIONS_AUTO_CLEANUP_DAYS || '30', 10);

/* ── Lecture / écriture ───────────────────── */

function loadNotifications() {
  try {
    const raw  = fs.readFileSync(STORE_PATH, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveNotifications(items) {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(items, null, 2), 'utf8');
  } catch { /* Silencieux */ }
}

/* ── Nettoyage automatique ───────────────── */

function _cleanOld(items) {
  const cutoff = Date.now() - AUTO_CLEANUP_DAYS * 24 * 60 * 60 * 1000;
  return items.filter(n => new Date(n.createdAt).getTime() > cutoff);
}

/* ── addNotification ─────────────────────── */
function addNotification(notification) {
  let items = loadNotifications();
  items = _cleanOld(items);
  items.unshift(notification);
  if (items.length > MAX_ITEMS) items = items.slice(0, MAX_ITEMS);
  saveNotifications(items);
  return notification;
}

/* ── listNotifications ───────────────────── */
function listNotifications(filters = {}) {
  let items = loadNotifications();

  if (filters.type)       items = items.filter(n => n.type  === filters.type);
  if (filters.level)      items = items.filter(n => n.level === filters.level);
  if (filters.unreadOnly) items = items.filter(n => !n.read);

  const limit = parseInt(filters.limit || '50', 10);
  return items.slice(0, limit);
}

/* ── markAsRead ──────────────────────────── */
function markAsRead(id) {
  const items = loadNotifications();
  const idx   = items.findIndex(n => n.id === id);
  if (idx === -1) return { success: false, reason: 'Notification introuvable.' };
  items[idx].read     = true;
  items[idx].readAt   = new Date().toISOString();
  saveNotifications(items);
  return { success: true, id };
}

/* ── markAllAsRead ───────────────────────── */
function markAllAsRead() {
  const items = loadNotifications();
  const now   = new Date().toISOString();
  let count   = 0;
  for (const n of items) {
    if (!n.read) { n.read = true; n.readAt = now; count++; }
  }
  saveNotifications(items);
  return { success: true, marked: count };
}

/* ── deleteNotification ──────────────────── */
function deleteNotification(id) {
  const items  = loadNotifications();
  const before = items.length;
  const next   = items.filter(n => n.id !== id);
  if (next.length === before) return { success: false, reason: 'Notification introuvable.' };
  saveNotifications(next);
  return { success: true, deleted: id };
}

/* ── clearNotifications ──────────────────── */
function clearNotifications() {
  const count = loadNotifications().length;
  saveNotifications([]);
  return { success: true, cleared: count };
}

/* ── getNotificationStats ────────────────── */
function getNotificationStats() {
  const items = loadNotifications();
  const byType  = {};
  const byLevel = {};
  let unread    = 0;
  let lastAt    = null;

  for (const n of items) {
    byType[n.type]   = (byType[n.type]   || 0) + 1;
    byLevel[n.level] = (byLevel[n.level] || 0) + 1;
    if (!n.read) unread++;
    if (!lastAt || n.createdAt > lastAt) lastAt = n.createdAt;
  }

  return {
    total:              items.length,
    unread,
    byType,
    byLevel,
    lastNotificationAt: lastAt,
  };
}

module.exports = {
  loadNotifications,
  saveNotifications,
  addNotification,
  listNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearNotifications,
  getNotificationStats,
};

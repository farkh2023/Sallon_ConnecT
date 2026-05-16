'use strict';
/* =============================================
   notifications.js — Phase 12
   Centre de notifications locales.
   Jamais de push cloud, Firebase, email, SMS.
============================================= */

const express = require('express');
const router  = express.Router();
const store   = require('../services/notifications/notificationStore');
const engine  = require('../services/notifications/notificationEngine');
const safety  = require('../services/notifications/notificationSafety');

/* ── GET /api/notifications/safety ─────────
   Avant les autres routes (route statique) */
router.get('/safety', (_req, res) => {
  res.json({
    localOnly:             true,
    browserEnabled:        process.env.NOTIFICATIONS_BROWSER_ENABLED === 'true',
    auditEnabled:          process.env.NOTIFICATIONS_AUDIT_ENABLED   !== 'false',
    maxItems:              parseInt(process.env.NOTIFICATIONS_MAX_ITEMS  || '200', 10),
    maskingEnabled:        process.env.NOTIFICATIONS_MASK_SENSITIVE_DATA !== 'false',
    dedupWindowMs:         parseInt(process.env.NOTIFICATIONS_DEDUP_WINDOW_MS || '30000', 10),
    autoCleanupDays:       parseInt(process.env.NOTIFICATIONS_AUTO_CLEANUP_DAYS || '30', 10),
    blockedSensitiveFields: ['token', 'password', 'secret', 'imei', 'serial', 'phone', 'mac', 'ip', 'path'],
    externalPush:          false,
    firebase:              false,
    cloudServices:         false,
  });
});

/* ── GET /api/notifications/stats ──────────
   Statique AVANT /:id */
router.get('/stats', (_req, res) => {
  res.json(store.getNotificationStats());
});

/* ── PATCH /api/notifications/read-all ─────
   Statique AVANT /:id */
router.patch('/read-all', (_req, res) => {
  res.json(store.markAllAsRead());
});

/* ── GET /api/notifications ─────────────── */
router.get('/', (req, res) => {
  const { type, level, unreadOnly, limit } = req.query;
  const filters = {
    type:       type       || null,
    level:      level      || null,
    unreadOnly: unreadOnly === 'true',
    limit:      parseInt(limit || '50', 10),
  };
  const items = store.listNotifications(filters);
  res.json({
    status: 'ok',
    count:  items.length,
    filters,
    items,
  });
});

/* ── POST /api/notifications ────────────── */
router.post('/', (req, res) => {
  const { type, level, title, message, meta } = req.body || {};

  const typeCheck  = safety.validateNotificationType(type  || 'system');
  const levelCheck = safety.validateNotificationLevel(level || 'info');

  if (!typeCheck.valid)  return res.status(400).json({ error: typeCheck.reason });
  if (!levelCheck.valid) return res.status(400).json({ error: levelCheck.reason });
  if (!title)            return res.status(400).json({ error: 'Champ "title" requis.' });

  const notif = engine.notify({ type, level, title, message: message || '', meta: meta || {} });
  if (!notif) {
    return res.status(429).json({ error: 'Notification dupliquée (déduplication active). Réessayez dans quelques secondes.' });
  }
  res.status(201).json({ success: true, notification: notif });
});

/* ── PATCH /api/notifications/:id/read ─── */
router.patch('/:id/read', (req, res) => {
  const result = store.markAsRead(req.params.id);
  if (!result.success) return res.status(404).json({ error: result.reason });
  res.json(result);
});

/* ── DELETE /api/notifications/:id ─────── */
router.delete('/:id', (req, res) => {
  const result = store.deleteNotification(req.params.id);
  if (!result.success) return res.status(404).json({ error: result.reason });
  res.json(result);
});

/* ── DELETE /api/notifications ──────────── */
router.delete('/', (_req, res) => {
  res.json(store.clearNotifications());
});

module.exports = router;

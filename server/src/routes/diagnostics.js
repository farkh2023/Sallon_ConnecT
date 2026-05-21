'use strict';
/* =============================================
   diagnostics.js — Phase 32
   Tableau de bord diagnostic avancé.
   Local uniquement — aucun secret exposé.
============================================= */

const express        = require('express');
const router         = express.Router();
const schedulerEngine = require('../services/scheduler/schedulerEngine');
const backupStore     = require('../services/backup/backupStore');
const notifStore      = require('../services/notifications/notificationStore');
const serverEventBus  = require('../services/serverEventBus');

router.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

/* ── GET /api/diagnostics/overview ────────── */
router.get('/overview', (_req, res) => {
  const memRaw = process.memoryUsage();

  let schedulerStatus = { status: 'unknown', activeSchedules: 0, totalSchedules: 0 };
  try {
    const s = schedulerEngine.getSchedulerStatus();
    schedulerStatus = {
      status:          s.status          ?? 'unknown',
      running:         s.status === 'running',
      activeSchedules: s.activeSchedules ?? 0,
      totalSchedules:  s.totalSchedules  ?? 0,
      tickMs:          s.tickMs          ?? null,
      nextScheduled:   s.nextScheduled   ?? null,
    };
  } catch { /* scheduler indisponible */ }

  let backupStatus = { enabled: false, count: 0, latest: null };
  try {
    const b = backupStore.getBackupStats();
    backupStatus = {
      enabled: process.env.BACKUP_ENABLED !== 'false',
      count:   b.count   ?? 0,
      latest:  b.latest  ? { backupId: b.latest.backupId, createdAt: b.latest.createdAt } : null,
    };
  } catch { /* backup indisponible */ }

  let notifStatus = { total: 0, unread: 0 };
  try {
    const n = notifStore.getNotificationStats();
    notifStatus = { total: n.total ?? 0, unread: n.unread ?? 0 };
  } catch { /* notifications indisponibles */ }

  res.json({
    timestamp:   new Date().toISOString(),
    status:      'ok',
    uptime:      Math.floor(process.uptime()),
    nodeVersion: process.version,
    memory: {
      rss:       memRaw.rss,
      heapUsed:  memRaw.heapUsed,
      heapTotal: memRaw.heapTotal,
    },
    scheduler:     schedulerStatus,
    backup:        backupStatus,
    notifications: notifStatus,
    sse: {
      clients: serverEventBus.getClientCount(),
    },
    security: {
      localOnly:     true,
      firebase:      false,
      cloudServices: false,
      externalPush:  false,
    },
  });
});

module.exports = router;

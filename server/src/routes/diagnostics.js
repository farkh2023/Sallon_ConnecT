'use strict';
/* =============================================
   diagnostics.js — Phase 32 / Phase 36 / Phase 40
   Tableau de bord diagnostic avancé.
   Local uniquement — aucun secret exposé.
============================================= */

const express        = require('express');
const router         = express.Router();
const { execFile }   = require('child_process');
const fs             = require('fs');
const path           = require('path');
const schedulerEngine = require('../services/scheduler/schedulerEngine');
const backupStore     = require('../services/backup/backupStore');
const notifStore      = require('../services/notifications/notificationStore');
const serverEventBus  = require('../services/serverEventBus');

const SERVICE_NAME = 'SallonConnecT';

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

/* ── GET /api/diagnostics/service ─────────── */
router.get('/service', (_req, res) => {
  const base = {
    timestamp:   new Date().toISOString(),
    name:        SERVICE_NAME,
    mode:        'standalone',
    status:      'running',
    uptime:      Math.floor(process.uptime()),
    pid:         process.pid,
    nodeVersion: process.version,
    lastStart:   null,
    restartCount: null,
    localOnly:   true,
  };

  if (process.platform !== 'win32') {
    return res.json(base);
  }

  execFile('sc', ['query', SERVICE_NAME], { timeout: 3000 }, (scErr, scOut) => {
    if (scErr) {
      execFile(
        'schtasks',
        ['/query', '/tn', SERVICE_NAME, '/fo', 'LIST'],
        { timeout: 3000 },
        (stErr, stOut) => {
          if (stErr) return res.json(base);
          const stateMatch = /Status\s*:\s*(\S+)/i.exec(stOut);
          const rawState   = stateMatch ? stateMatch[1].toLowerCase() : 'unknown';
          return res.json(Object.assign({}, base, {
            mode:   'task-scheduler',
            status: rawState === 'running' ? 'running' : rawState === 'ready' ? 'stopped' : rawState,
          }));
        }
      );
      return;
    }

    const stateMatch = /STATE\s*:\s*\d+\s+(\w+)/i.exec(scOut);
    const rawState   = stateMatch ? stateMatch[1].toLowerCase() : 'unknown';
    const status     = rawState === 'running' ? 'running' : rawState === 'stopped' ? 'stopped' : 'degraded';

    res.json(Object.assign({}, base, {
      mode:   'nssm',
      status,
    }));
  });
});

/* ── GET /api/diagnostics/backup ──────────── */
router.get('/backup', (_req, res) => {
  const rootDir      = path.resolve(__dirname, '..', '..', '..');
  const snapshotsDir = path.join(rootDir, 'backups', 'snapshots');

  const result = {
    timestamp:    new Date().toISOString(),
    snapshotsDir: snapshotsDir.replace(rootDir, '<root>'),
    total:        0,
    latest:       null,
    snapshots:    [],
    security:     { localOnly: true, noCloud: true },
  };

  if (!fs.existsSync(snapshotsDir)) {
    return res.json(result);
  }

  let entries = [];
  try {
    entries = fs.readdirSync(snapshotsDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
      .sort()
      .reverse();
  } catch { return res.json(result); }

  result.total = entries.length;

  for (const id of entries.slice(0, 10)) {
    const snapDir  = path.join(snapshotsDir, id);
    const metaPath = path.join(snapDir, 'metadata.json');
    const entry    = { snapshotId: id, valid: false, version: null, type: null,
                       fileCount: 0, totalSizeKB: 0, hasChecksum: false };

    if (fs.existsSync(metaPath)) {
      try {
        const meta     = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        entry.valid     = true;
        entry.version   = meta.version   ?? null;
        entry.type      = meta.type       ?? null;
        entry.fileCount = meta.fileCount  ?? 0;
        entry.description = meta.description ?? '';
        entry.timestamp   = meta.timestamp   ?? null;
      } catch { /* meta illisible */ }
    }

    entry.hasChecksum = fs.existsSync(path.join(snapDir, 'checksum.json'));

    let totalBytes = 0;
    try {
      const walk = (dir) => {
        for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
          const fp = path.join(dir, f.name);
          if (f.isDirectory()) walk(fp);
          else totalBytes += fs.statSync(fp).size;
        }
      };
      walk(snapDir);
    } catch { /* erreur lecture */ }
    entry.totalSizeKB = Math.round(totalBytes / 1024 * 10) / 10;

    result.snapshots.push(entry);
  }

  if (result.snapshots.length > 0) {
    result.latest = result.snapshots[0];
  }

  res.json(result);
});

module.exports = router;

'use strict';

const safety = require('./snapshotSafety');
const store = require('./snapshotStore');
const notifEngine = require('../notifications/notificationEngine');

const NOTIFY_WARNING = process.env.OBSERVABILITY_SNAPSHOTS_NOTIFY_ON_WARNING !== 'false';
const NOTIFY_ERROR = process.env.OBSERVABILITY_SNAPSHOTS_NOTIFY_ON_ERROR !== 'false';

function _genId() {
  return `obs_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function _parseMb(str) {
  if (!str || typeof str !== 'string') return 0;
  const m = str.match(/([0-9.]+)\s*(MB|KB|B)/i);
  if (!m) return 0;
  const val = parseFloat(m[1]);
  if (m[2].toUpperCase() === 'KB') return val / 1024;
  if (m[2].toUpperCase() === 'B') return val / 1024 / 1024;
  return val;
}

function _uptimeBucket(seconds) {
  if (seconds < 300) return 'short';
  if (seconds < 3600) return 'medium';
  return 'long';
}

function _memoryBucket(usedStr, totalStr) {
  const used = _parseMb(usedStr);
  const total = _parseMb(totalStr);
  if (!total) return 'low';
  const ratio = used / total;
  if (ratio < 0.4) return 'low';
  if (ratio < 0.7) return 'medium';
  return 'high';
}

function _countBucket(n) {
  const num = parseInt(n, 10) || 0;
  if (num === 0) return 'none';
  if (num < 10) return 'low';
  if (num < 50) return 'medium';
  return 'high';
}

function _integrationStatus(intg) {
  if (!intg || !intg.enabled) return 'disabled';
  return 'available';
}

function _securityEventsBucket(security) {
  if (!security || !security.summary) return 'none';
  const w = security.summary.warning || 0;
  if (w === 0) return 'none';
  if (w < 3) return 'low';
  if (w < 10) return 'medium';
  return 'high';
}

function createSnapshotFromOverview(overview, source) {
  const be = overview.backend || {};
  const fe = overview.frontend || {};
  const intg = overview.integrations || {};
  const sched = overview.scheduler || {};
  const notif = overview.notifications || {};
  const sec = overview.security || {};
  const rt = overview.runtime || {};
  const logs = overview.logs || {};

  const raw = {
    id: _genId(),
    createdAt: new Date().toISOString(),
    source: source || 'manual',
    status: overview.status || 'ok',
    phase: 18,
    backend: {
      ok: be.status === 'ok',
      uptimeBucket: _uptimeBucket(be.uptimeSeconds || 0),
      memoryBucket: _memoryBucket(be.memoryUsed, be.memoryTotal),
    },
    frontend: {
      expectedPort: fe.expectedPort || 3001,
      configured: Boolean(fe.expectedPort),
    },
    integrations: {
      adb:         _integrationStatus(intg.adb),
      dlna:        _integrationStatus(intg.dlna),
      smartThings: _integrationStatus(intg.smartThings),
      streaming:   _integrationStatus(intg.streaming),
    },
    scheduler: {
      running:         sched.enabled !== false,
      activeSchedules: sched.activeSchedules || 0,
    },
    notifications: {
      totalBucket:          _countBucket(notif.total),
      unreadBucket:         _countBucket(notif.unread),
      securityEventsBucket: _securityEventsBucket(sec),
    },
    security: {
      secretsProtected:        sec.secretsMasked !== false,
      runtimeHidden:           rt.contentHidden !== false,
      apiCacheDisabled:        fe.apiCacheDisabled !== false,
      sensitiveActionsBlocked: sec.sensitiveActionsBlocked !== false,
    },
    runtime: {
      runtimeFilesBucket: _countBucket(rt.runtimeJsonFiles),
      logsBucket:         _countBucket(logs.count),
      portableZipPresent: Boolean(rt.latestPortableZip && rt.latestPortableZip.present),
    },
  };

  return safety.sanitizeSnapshot(raw);
}

function createSnapshot(source) {
  try {
    const { collectOverview } = require('./overviewCollector');
    const overview = collectOverview({ notifyOnStatusChange: false });
    const snapshot = createSnapshotFromOverview(overview, source || 'manual');
    store.addSnapshot(snapshot);
    notifySnapshotStatus(snapshot);
    return snapshot;
  } catch (err) {
    return safety.buildSafeSnapshotError(err);
  }
}

function computeTrends() {
  const items = store.listSnapshots({ limit: 20 });

  if (items.length === 0) {
    return {
      statusTrend: 'stable',
      warningFrequency: 0,
      errorFrequency: 0,
      memoryTrend: 'stable',
      notificationTrend: 'stable',
      schedulerTrend: 'stable',
      integrationTrend: 'stable',
    };
  }

  const total = items.length;
  const warningFrequency = Math.round((items.filter(s => s.status === 'warning').length / total) * 100);
  const errorFrequency = Math.round((items.filter(s => s.status === 'error').length / total) * 100);

  const mid = Math.floor(total / 2) || 1;
  const recent = items.slice(0, mid);
  const older = items.slice(mid);

  function statusScore(arr) {
    if (!arr.length) return 2;
    const sum = arr.reduce((acc, s) => {
      if (s.status === 'ok') return acc + 2;
      if (s.status === 'warning') return acc + 1;
      return acc;
    }, 0);
    return sum / arr.length;
  }

  const recentScore = statusScore(recent);
  const olderScore = statusScore(older);
  let statusTrend = 'stable';
  if (recentScore > olderScore + 0.3) statusTrend = 'improving';
  else if (recentScore < olderScore - 0.3) statusTrend = 'degrading';

  const bucketToNum = { low: 0, medium: 1, high: 2 };
  function avg(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }

  const memRecent = recent.map(s => bucketToNum[s.backend && s.backend.memoryBucket] || 0);
  const memOlder = older.map(s => bucketToNum[s.backend && s.backend.memoryBucket] || 0);
  let memoryTrend = 'stable';
  if (older.length) {
    const diff = avg(memRecent) - avg(memOlder);
    if (diff > 0.3) memoryTrend = 'increasing';
    else if (diff < -0.3) memoryTrend = 'decreasing';
  }

  const notifBucket = ['none', 'low', 'medium', 'high'];
  const notifRecent = avg(recent.map(s => notifBucket.indexOf((s.notifications && s.notifications.unreadBucket) || 'none')));
  const notifOlder = avg(older.map(s => notifBucket.indexOf((s.notifications && s.notifications.unreadBucket) || 'none')));
  let notificationTrend = 'stable';
  if (older.length) {
    const diff = notifRecent - notifOlder;
    if (diff > 0.3) notificationTrend = 'increasing';
    else if (diff < -0.3) notificationTrend = 'decreasing';
  }

  const activeCount = recent.filter(s => s.scheduler && s.scheduler.running).length;
  const schedulerTrend = activeCount === recent.length ? 'stable' : 'intermittent';

  return {
    statusTrend,
    warningFrequency,
    errorFrequency,
    memoryTrend,
    notificationTrend,
    schedulerTrend,
    integrationTrend: 'stable',
  };
}

function compareWithPreviousSnapshot() {
  const items = store.listSnapshots({ limit: 2 });
  if (items.length < 2) {
    return { hasComparison: false, message: 'Not enough snapshots to compare.' };
  }
  const [current, previous] = items;
  const changes = [];
  if (current.status !== previous.status) {
    changes.push({ field: 'status', from: previous.status, to: current.status });
  }
  if (current.backend && previous.backend && current.backend.memoryBucket !== previous.backend.memoryBucket) {
    changes.push({ field: 'memoryBucket', from: previous.backend.memoryBucket, to: current.backend.memoryBucket });
  }
  return {
    hasComparison: true,
    changesDetected: changes.length > 0,
    changes,
    previousCreatedAt: previous.createdAt,
    currentCreatedAt: current.createdAt,
  };
}

function notifySnapshotStatus(snapshot) {
  if (!snapshot || snapshot.status === 'ok') return null;
  if (snapshot.status === 'warning' && !NOTIFY_WARNING) return null;
  if (snapshot.status === 'error' && !NOTIFY_ERROR) return null;

  return notifEngine.notify({
    type: 'system',
    level: snapshot.status,
    title: 'Snapshot observabilite',
    message: `Snapshot observabilite : etat ${snapshot.status} detecte.`,
    meta: { phase: 18, snapshotStatus: snapshot.status },
  });
}

module.exports = {
  createSnapshot,
  createSnapshotFromOverview,
  computeTrends,
  compareWithPreviousSnapshot,
  notifySnapshotStatus,
};

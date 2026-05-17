'use strict';

const { sanitizeForResponse } = require('./sanitizer');

const STATUS_SCORE     = { ok: 1, warning: 0.5, error: 0 };
const MEMORY_SCORE     = { low: 1, medium: 0.5, high: 0 };
const NOTIF_SCORE      = { none: 1, low: 0.75, medium: 0.5, high: 0.25 };
const INTEGRATION_SCORE = { available: 1, disabled: 0.75, warning: 0.5, error: 0 };
const RUNTIME_SCORE    = { none: 1, low: 0.75, medium: 0.5, high: 0.25 };

function round2(n) {
  return Math.round(n * 100) / 100;
}

function scoreSnapshot(snap) {
  const statusScore = STATUS_SCORE[snap.status] ?? 0;

  const memoryScore = MEMORY_SCORE[(snap.backend || {}).memoryBucket] ?? 0.5;

  const notif = snap.notifications || {};
  const unreadScore = NOTIF_SCORE[notif.unreadBucket]  ?? 1;
  const totalScore  = NOTIF_SCORE[notif.totalBucket]   ?? 1;
  const notificationScore = (unreadScore + totalScore) / 2;

  const sec = snap.security || {};
  const secValues = [sec.secretsProtected, sec.runtimeHidden, sec.apiCacheDisabled, sec.sensitiveActionsBlocked];
  const trueCount = secValues.filter(Boolean).length;
  const securityScore = trueCount === 4 ? 1 : trueCount >= 3 ? 0.5 : 0;

  const intg = snap.integrations || {};
  const integrationValues = Object.values(intg).map(v => INTEGRATION_SCORE[v] ?? 0.75);
  const integrationScore = integrationValues.length
    ? integrationValues.reduce((a, b) => a + b, 0) / integrationValues.length
    : 0.75;

  const sched = snap.scheduler || {};
  const schedulerScore = sched.running ? 1 : 0.5;

  const rt = snap.runtime || {};
  const rtFileScore = RUNTIME_SCORE[rt.runtimeFilesBucket] ?? 1;
  const rtLogScore  = RUNTIME_SCORE[rt.logsBucket]         ?? 1;
  const runtimeScore = (rtFileScore + rtLogScore) / 2;

  return {
    statusScore:       round2(statusScore),
    memoryScore:       round2(memoryScore),
    notificationScore: round2(notificationScore),
    securityScore:     round2(securityScore),
    integrationScore:  round2(integrationScore),
    schedulerScore:    round2(schedulerScore),
    runtimeScore:      round2(runtimeScore),
  };
}

function buildTimelineItem(snap) {
  const scores = scoreSnapshot(snap);
  const id = snap.id ? String(snap.id).slice(0, 12) : undefined;
  return sanitizeForResponse({
    id,
    createdAt: snap.createdAt,
    source:    snap.source,
    status:    snap.status,
    ...scores,
  });
}

function applyFilters(snapshots, filters) {
  let items = [...snapshots];

  if (filters.status) {
    items = items.filter(s => s.status === filters.status);
  }
  if (filters.source) {
    items = items.filter(s => s.source === filters.source);
  }
  if (filters.from) {
    const from = new Date(filters.from);
    if (!isNaN(from.getTime())) {
      items = items.filter(s => new Date(s.createdAt) >= from);
    }
  }
  if (filters.to) {
    const to = new Date(filters.to);
    if (!isNaN(to.getTime())) {
      items = items.filter(s => new Date(s.createdAt) <= to);
    }
  }

  const limit = filters.limit ? Math.min(Math.max(1, parseInt(filters.limit, 10)), 200) : 50;
  return items.slice(0, limit);
}

function buildTimeline(snapshots, filters) {
  const filtered = applyFilters(snapshots, filters || {});
  const items = filtered.map(buildTimelineItem);
  const summary = {
    total:   items.length,
    ok:      items.filter(i => i.status === 'ok').length,
    warning: items.filter(i => i.status === 'warning').length,
    error:   items.filter(i => i.status === 'error').length,
  };
  return { items, summary };
}

function buildCsv(snapshots) {
  const header = 'createdAt,status,source,memoryBucket,notificationsBucket,schedulerRunning,portableZipPresent';
  const rows = snapshots.map(snap => [
    snap.createdAt || '',
    snap.status    || '',
    snap.source    || '',
    (snap.backend       && snap.backend.memoryBucket)       || '',
    (snap.notifications && snap.notifications.unreadBucket) || '',
    (snap.scheduler     && snap.scheduler.running)  ? 'true' : 'false',
    (snap.runtime       && snap.runtime.portableZipPresent) ? 'true' : 'false',
  ].join(','));
  return [header, ...rows].join('\n');
}

module.exports = {
  buildTimeline,
  buildCsv,
  scoreSnapshot,
};

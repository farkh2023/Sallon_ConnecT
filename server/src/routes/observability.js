'use strict';

const express = require('express');
const router = express.Router();
const { collectHealth } = require('../services/observability/healthCollector');
const { collectSecurity } = require('../services/observability/securityCollector');
const { collectRuntime } = require('../services/observability/runtimeCollector');
const { collectTests } = require('../services/observability/testCollector');
const { collectLogs } = require('../services/observability/logCollector');
const {
  collectOverview,
  collectSafety,
} = require('../services/observability/overviewCollector');
const { sanitizeForResponse } = require('../services/observability/sanitizer');
const snapshotEngine = require('../services/observability/snapshotEngine');
const snapshotStore = require('../services/observability/snapshotStore');
const { buildSafeSnapshotError } = require('../services/observability/snapshotSafety');
const { buildTimeline, buildCsv } = require('../services/observability/snapshotTimeline');

const SNAPSHOTS_MAX_ITEMS = parseInt(process.env.OBSERVABILITY_SNAPSHOTS_MAX_ITEMS || '200', 10);

router.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

function sendCollected(res, collect) {
  try {
    res.json(sanitizeForResponse(collect()));
  } catch {
    res.status(500).json({
      status: 'error',
      error: 'Observability collector failed safely.',
      secretsMasked: true,
    });
  }
}

router.get('/overview', (_req, res) => {
  sendCollected(res, () => collectOverview({ notifyOnStatusChange: true }));
});

router.get('/health', (_req, res) => {
  sendCollected(res, collectHealth);
});

router.get('/security', (_req, res) => {
  sendCollected(res, collectSecurity);
});

router.get('/runtime', (_req, res) => {
  sendCollected(res, collectRuntime);
});

router.get('/tests', (_req, res) => {
  sendCollected(res, collectTests);
});

router.get('/logs', (_req, res) => {
  sendCollected(res, collectLogs);
});

router.get('/safety', (_req, res) => {
  sendCollected(res, collectSafety);
});

/* ── Phase 18B — Snapshots ───────────────── */

router.get('/snapshots/latest', (_req, res) => {
  try {
    const snapshot = snapshotStore.getLatestSnapshot();
    if (!snapshot) return res.status(404).json({ status: 'not_found', message: 'No snapshot yet.' });
    res.json(sanitizeForResponse(snapshot));
  } catch {
    res.status(500).json(buildSafeSnapshotError());
  }
});

router.get('/snapshots/stats', (_req, res) => {
  try {
    res.json(sanitizeForResponse(snapshotStore.getSnapshotStats()));
  } catch {
    res.status(500).json(buildSafeSnapshotError());
  }
});

router.get('/snapshots/trends', (_req, res) => {
  try {
    res.json(sanitizeForResponse(snapshotEngine.computeTrends()));
  } catch {
    res.status(500).json(buildSafeSnapshotError());
  }
});

router.get('/snapshots/safety', (_req, res) => {
  res.json({
    localOnly: true,
    runtimeContentHidden: true,
    logsContentHidden: true,
    secretsMasked: true,
    maxItems: SNAPSHOTS_MAX_ITEMS,
    storagePathMasked: true,
  });
});

router.get('/snapshots', (req, res) => {
  try {
    const filters = {};
    if (req.query.source) filters.source = String(req.query.source);
    if (req.query.status) filters.status = String(req.query.status);
    if (req.query.limit) filters.limit = String(req.query.limit);
    const items = snapshotStore.listSnapshots(filters);
    res.json(sanitizeForResponse({ snapshots: items, total: items.length }));
  } catch {
    res.status(500).json(buildSafeSnapshotError());
  }
});

router.post('/snapshots', (_req, res) => {
  try {
    const snapshot = snapshotEngine.createSnapshot('manual');
    res.status(201).json(sanitizeForResponse(snapshot));
  } catch {
    res.status(500).json(buildSafeSnapshotError());
  }
});

router.delete('/snapshots', (_req, res) => {
  try {
    const result = snapshotStore.clearSnapshots();
    res.json({ status: 'ok', ...result });
  } catch {
    res.status(500).json(buildSafeSnapshotError());
  }
});

/* ── Phase 19 — Timeline & Export ─────────── */

router.get('/snapshots/timeline', (req, res) => {
  try {
    const filters = {
      limit:  req.query.limit  ? String(req.query.limit)  : undefined,
      status: req.query.status ? String(req.query.status) : undefined,
      source: req.query.source ? String(req.query.source) : undefined,
      from:   req.query.from   ? String(req.query.from)   : undefined,
      to:     req.query.to     ? String(req.query.to)     : undefined,
    };
    const snapshots = snapshotStore.loadSnapshots();
    const result = buildTimeline(snapshots, filters);
    res.json(result);
  } catch {
    res.status(500).json(buildSafeSnapshotError());
  }
});

router.get('/snapshots/export.json', (_req, res) => {
  try {
    const snapshots = snapshotStore.loadSnapshots();
    const safe = sanitizeForResponse(snapshots);
    res.setHeader('Content-Disposition', 'attachment; filename="observability-snapshots.json"');
    res.setHeader('Content-Type', 'application/json');
    res.json(safe);
  } catch {
    res.status(500).json(buildSafeSnapshotError());
  }
});

router.get('/snapshots/export.csv', (_req, res) => {
  try {
    const snapshots = snapshotStore.loadSnapshots();
    const csv = buildCsv(snapshots);
    res.setHeader('Content-Disposition', 'attachment; filename="observability-snapshots.csv"');
    res.setHeader('Content-Type', 'text/csv');
    res.send(csv);
  } catch {
    res.status(500).json(buildSafeSnapshotError());
  }
});

module.exports = router;

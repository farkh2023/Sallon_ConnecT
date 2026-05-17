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

module.exports = router;

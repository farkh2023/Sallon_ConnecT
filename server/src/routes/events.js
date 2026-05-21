'use strict';

const express = require('express');
const router = express.Router();
const serverEventBus = require('../services/serverEventBus');

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
];

const HEARTBEAT_INTERVAL_MS = 30_000;

router.get('/stream', (req, res) => {
  const origin = req.headers.origin ?? '';
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ error: 'Origine non autorisée', localOnly: true });
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const clientId = serverEventBus.subscribe(res);
  if (clientId === null) {
    res.write(`data: ${JSON.stringify({ type: 'sse.error', message: 'Trop de clients connectés' })}\n\n`);
    return res.end();
  }

  res.write(`data: ${JSON.stringify({
    id: `srv_conn_${Date.now()}`,
    type: 'sse.connected',
    severity: 'info',
    source: 'backend',
    message: 'Flux SSE connecté',
    timestamp: new Date().toISOString(),
  })}\n\n`);

  const heartbeatTimer = setInterval(() => {
    try {
      res.write(`data: ${JSON.stringify({
        id: `srv_hb_${Date.now()}`,
        type: 'sse.heartbeat',
        severity: 'info',
        source: 'backend',
        message: 'heartbeat',
        timestamp: new Date().toISOString(),
      })}\n\n`);
    } catch {
      clearInterval(heartbeatTimer);
      serverEventBus.unsubscribe(clientId);
    }
  }, HEARTBEAT_INTERVAL_MS);

  req.on('close', () => {
    clearInterval(heartbeatTimer);
    serverEventBus.unsubscribe(clientId);
  });
});

router.get('/client-count', (_req, res) => {
  res.json({ clients: serverEventBus.getClientCount() });
});

module.exports = router;

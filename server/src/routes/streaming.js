'use strict';
/* =============================================
   streaming.js — Phase 11 + Phase 12
   Routes du module streaming assisté.
   Toutes les actions de lecture nécessitent confirmation.
   Aucun chemin absolu exposé. Aucun renderer hors allowlist.
============================================= */

const express  = require('express');
const router   = express.Router();
const dlna     = require('../services/media/dlnaConnector');
const library  = require('../services/media/localMediaLibrary');
const queue    = require('../services/media/playQueue');
const notif    = require('../services/notifications/notificationEngine');

/* ── GET /api/streaming/policy ────────────── */
router.get('/policy', (_req, res) => {
  res.json(dlna.getStreamingPolicy());
});

/* ── GET /api/streaming/renderers ─────────── */
router.get('/renderers', (_req, res) => {
  res.json(dlna.getAllowedRenderers());
});

/* ── GET /api/streaming/library/status ────── */
router.get('/library/status', (_req, res) => {
  res.json(library.getLibraryStatus());
});

/* ── POST /api/streaming/library/scan ─────── */
router.post('/library/scan', (_req, res) => {
  const result = library.scanAllowedDirectory();
  res.json(result);
});

/* ── GET /api/streaming/library/items ─────── */
router.get('/library/items', (_req, res) => {
  res.json(library.listMediaItems());
});

/* ── GET /api/streaming/queue ─────────────── */
router.get('/queue', (_req, res) => {
  res.json({ status: 'ok', ...queue.previewQueue(), summary: queue.getQueueSummary() });
});

/* ── POST /api/streaming/queue ────────────── */
router.post('/queue', (req, res) => {
  const { mediaId } = req.body || {};
  if (!mediaId) {
    return res.status(400).json({ error: 'mediaId requis.' });
  }
  const result = queue.addToQueue(mediaId);
  if (!result.success) {
    return res.status(400).json({ error: result.reason });
  }
  res.json(result);
});

/* ── DELETE /api/streaming/queue ──────────── */
router.delete('/queue', (_req, res) => {
  res.json(queue.clearQueue());
});

/* ── DELETE /api/streaming/queue/:itemId ──── */
router.delete('/queue/:itemId', (req, res) => {
  const result = queue.removeFromQueue(req.params.itemId);
  if (!result.success) {
    return res.status(404).json({ error: result.reason });
  }
  res.json(result);
});

/* ── POST /api/streaming/queue/:itemId/move ─ */
router.post('/queue/:itemId/move', (req, res) => {
  const { direction } = req.body || {};
  if (!['up', 'down'].includes(direction)) {
    return res.status(400).json({ error: 'direction doit être "up" ou "down".' });
  }
  const result = queue.moveQueueItem(req.params.itemId, direction);
  if (!result.success) {
    return res.status(400).json({ error: result.reason });
  }
  res.json(result);
});

/* ── POST /api/streaming/preview ──────────── */
router.post('/preview', (req, res) => {
  const { mediaId, rendererId } = req.body || {};
  if (!mediaId || !rendererId) {
    return res.status(400).json({ error: 'mediaId et rendererId requis.' });
  }
  const result = dlna.previewStreamToRenderer(mediaId, rendererId);
  if (result.valid) {
    notif.notify({ type: 'streaming', level: 'info',
      title: 'Prévisualisation streaming',
      message: `Aperçu créé pour "${result.title || mediaId}" — aucune lecture lancée`,
      meta: { mediaId, type: result.type },
    });
  }
  res.json(result);
});

/* ── POST /api/streaming/play ─────────────── */
router.post('/play', (req, res) => {
  const { mediaId, rendererId, confirmation, rendererName } = req.body || {};
  if (!mediaId || !rendererId) {
    return res.status(400).json({ error: 'mediaId et rendererId requis.' });
  }
  const result = dlna.streamToRenderer(mediaId, rendererId, { confirmation, rendererName });
  if (result.status === 'blocked') {
    notif.notify({ type: 'streaming', level: 'warning',
      title: 'Streaming refusé',
      message: result.reason || 'Lecture refusée par les gardes de sécurité',
      meta: { mediaId },
    });
    return res.status(403).json(result);
  }
  notif.notify({ type: 'streaming', level: 'success',
    title: 'Streaming assisté prêt',
    message: `Instructions de lecture générées — mode assisté`,
    meta: { mediaId, auditId: result.auditId },
  });
  res.json(result);
});

/* ── POST /api/streaming/stop ─────────────── */
router.post('/stop', (req, res) => {
  const { rendererId, confirmation } = req.body || {};
  if (!rendererId) {
    return res.status(400).json({ error: 'rendererId requis.' });
  }
  const result = dlna.stopRendererPlayback(rendererId, { confirmation });
  if (result.status === 'blocked') {
    return res.status(403).json(result);
  }
  res.json(result);
});

/* ── GET /api/streaming/audit ─────────────── */
router.get('/audit', (_req, res) => {
  res.json(dlna.getStreamingAuditHistory());
});

/* ── DELETE /api/streaming/audit ──────────── */
router.delete('/audit', (_req, res) => {
  res.json(dlna.clearStreamingAuditHistory());
});

module.exports = router;

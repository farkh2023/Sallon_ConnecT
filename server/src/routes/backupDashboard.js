'use strict';
/* =============================================
   backupDashboard.js — Phase 41
   Tableau de bord visuel des sauvegardes.
   Local uniquement — aucun secret expose.
============================================= */

const express = require('express');
const router  = express.Router();
const service = require('../services/backupDashboard/backupDashboardService');
const safety  = require('../services/backupDashboard/backupDashboardSafety');

router.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

/* ── GET /api/backups/safety ──────────────── */
router.get('/safety', (_req, res) => {
  res.json(service.getSafety());
});

/* ── GET /api/backups/dashboard ──────────── */
router.get('/dashboard', async (_req, res) => {
  try {
    const data = await service.getDashboard();
    res.json(data);
  } catch (err) {
    res.status(500).json(safety.buildSafeBackupDashboardError(err));
  }
});

/* ── GET /api/backups/list ───────────────── */
router.get('/list', async (_req, res) => {
  try {
    const items = await service.listBackups();
    res.json({ items, total: items.length });
  } catch (err) {
    res.status(500).json(safety.buildSafeBackupDashboardError(err));
  }
});

/* ── POST /api/backups/create ────────────── */
router.post('/create', async (req, res) => {
  const body = req.body || {};
  const type = body.type;
  if (type && !['quick', 'full'].includes(type)) {
    return res.status(400).json({ error: 'type must be quick or full' });
  }
  try {
    const result = await service.createBackup({ type: type || 'quick', exportZip: !!body.exportZip });
    res.json(result);
  } catch (err) {
    res.status(500).json(safety.buildSafeBackupDashboardError(err));
  }
});

/* ── POST /api/backups/:id/verify ────────── */
router.post('/:id/verify', async (req, res) => {
  const safeId = safety.sanitizeBackupId(req.params.id);
  if (!safeId) return res.status(400).json({ error: 'invalid_backup_id' });
  try {
    const result = await service.verifyBackup(safeId);
    res.json(result);
  } catch (err) {
    res.status(500).json(safety.buildSafeBackupDashboardError(err));
  }
});

/* ── POST /api/backups/:id/export ────────── */
router.post('/:id/export', async (req, res) => {
  const safeId = safety.sanitizeBackupId(req.params.id);
  if (!safeId) return res.status(400).json({ error: 'invalid_backup_id' });
  try {
    const result = await service.exportBackup(safeId);
    res.json(result);
  } catch (err) {
    res.status(500).json(safety.buildSafeBackupDashboardError(err));
  }
});

/* ── DELETE /api/backups/:id ─────────────── */
router.delete('/:id', async (req, res) => {
  const safeId = safety.sanitizeBackupId(req.params.id);
  if (!safeId) return res.status(400).json({ error: 'invalid_backup_id' });
  const body = req.body || {};
  if (body.confirmation !== 'SUPPRIMER') {
    return res.status(400).json({ error: 'confirmation_required', expected: 'SUPPRIMER' });
  }
  try {
    const result = await service.deleteBackup(safeId, body.confirmation);
    res.json(result);
  } catch (err) {
    res.status(500).json(safety.buildSafeBackupDashboardError(err));
  }
});

/* ── POST /api/backups/:id/restore/prepare ── */
router.post('/:id/restore/prepare', (req, res) => {
  const safeId = safety.sanitizeBackupId(req.params.id);
  if (!safeId) return res.status(400).json({ error: 'invalid_backup_id' });
  const result = service.prepareRestore(safeId);
  res.json(result);
});

module.exports = router;

'use strict';

const express = require('express');
const router = express.Router();

const { sanitizeBackupOptions, validateBackupOptions, sanitizeManifestForResponse, buildSafeBackupError, FORBIDDEN_PATTERNS } = require('../services/backup/backupSafety');
const { createBackup, verifyBackup } = require('../services/backup/backupEngine');
const { listBackups, getBackupInfo, getBackupPath, deleteBackup, getBackupStats } = require('../services/backup/backupStore');
const { dryRunRestore, restoreBackup, inspectBackup } = require('../services/backup/restoreEngine');
const { listAudit, clearAudit } = require('../services/backup/backupAudit');

const BACKUP_ENABLED = process.env.BACKUP_ENABLED !== 'false';

router.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// GET /api/backup/status
router.get('/status', (_req, res) => {
  const stats = getBackupStats();
  res.json({
    enabled: BACKUP_ENABLED,
    backupDirMasked: stats.backupDir,
    maxItems: stats.maxItems,
    rollbackEnabled: process.env.BACKUP_ROLLBACK_ENABLED !== 'false',
    dryRunRequired: process.env.BACKUP_RESTORE_DRY_RUN_REQUIRED !== 'false',
    confirmationRequired: process.env.BACKUP_REQUIRE_CONFIRMATION !== 'false',
    count: stats.count,
    latest: stats.latest ? { backupId: stats.latest.backupId, createdAt: stats.latest.createdAt } : null,
  });
});

// GET /api/backup/backups
router.get('/backups', (_req, res) => {
  if (!BACKUP_ENABLED) return res.status(503).json({ error: 'Backup désactivé.' });
  res.json({ backups: listBackups() });
});

// POST /api/backup/create
router.post('/create', async (req, res) => {
  if (!BACKUP_ENABLED) return res.status(503).json({ error: 'Backup désactivé.' });
  try {
    const options = sanitizeBackupOptions(req.body || {});
    const optValidation = validateBackupOptions(options);
    if (!optValidation.valid) return res.status(400).json({ error: optValidation.error });

    const result = await createBackup(options);
    res.json({ status: 'ok', ...result });
  } catch (err) {
    res.status(500).json(buildSafeBackupError(err));
  }
});

// GET /api/backup/backups/:id
router.get('/backups/:id', (req, res) => {
  if (!BACKUP_ENABLED) return res.status(503).json({ error: 'Backup désactivé.' });
  const info = getBackupInfo(req.params.id);
  if (!info) return res.status(404).json({ error: 'Sauvegarde introuvable.' });
  const { manifest, ...rest } = info;
  res.json({ ...rest, manifestPresent: !!manifest });
});

// GET /api/backup/backups/:id/manifest
router.get('/backups/:id/manifest', (req, res) => {
  if (!BACKUP_ENABLED) return res.status(503).json({ error: 'Backup désactivé.' });
  const info = getBackupInfo(req.params.id);
  if (!info || !info.manifest) return res.status(404).json({ error: 'Manifest introuvable.' });
  res.json({ manifest: sanitizeManifestForResponse(info.manifest) });
});

// POST /api/backup/backups/:id/verify
router.post('/backups/:id/verify', (req, res) => {
  if (!BACKUP_ENABLED) return res.status(503).json({ error: 'Backup désactivé.' });
  const zipPath = getBackupPath(req.params.id);
  if (!zipPath) return res.status(404).json({ error: 'Sauvegarde introuvable.' });
  try {
    const result = verifyBackup(zipPath);
    res.json({ backupId: req.params.id, ...result });
  } catch (err) {
    res.status(500).json(buildSafeBackupError(err));
  }
});

// POST /api/backup/backups/:id/restore/dry-run
router.post('/backups/:id/restore/dry-run', (req, res) => {
  if (!BACKUP_ENABLED) return res.status(503).json({ error: 'Backup désactivé.' });
  try {
    const result = dryRunRestore(req.params.id, req.body || {});
    if (result.error) return res.status(400).json(result);
    res.json(result);
  } catch (err) {
    res.status(500).json(buildSafeBackupError(err));
  }
});

// POST /api/backup/backups/:id/restore
router.post('/backups/:id/restore', async (req, res) => {
  if (!BACKUP_ENABLED) return res.status(503).json({ error: 'Backup désactivé.' });
  try {
    const result = await restoreBackup(req.params.id, req.body || {});
    if (result.error) {
      return res.status(result.refused || result.dryRunRequired ? 403 : 400).json(result);
    }
    res.json({ status: 'restored', ...result });
  } catch (err) {
    res.status(500).json(buildSafeBackupError(err));
  }
});

// DELETE /api/backup/backups/:id
router.delete('/backups/:id', (req, res) => {
  if (!BACKUP_ENABLED) return res.status(503).json({ error: 'Backup désactivé.' });
  try {
    const result = deleteBackup(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// GET /api/backup/audit
router.get('/audit', (_req, res) => {
  res.json({ audit: listAudit() });
});

// DELETE /api/backup/audit
router.delete('/audit', (_req, res) => {
  clearAudit();
  res.json({ cleared: true });
});

// GET /api/backup/safety
router.get('/safety', (_req, res) => {
  res.json({
    localOnly: true,
    cloudSync: false,
    envExcluded: true,
    secretsExcluded: true,
    rollbackEnabled: process.env.BACKUP_ROLLBACK_ENABLED !== 'false',
    dryRunRequired: process.env.BACKUP_RESTORE_DRY_RUN_REQUIRED !== 'false',
    forbiddenPaths: FORBIDDEN_PATTERNS.map(p => p.toString()),
  });
});

module.exports = router;

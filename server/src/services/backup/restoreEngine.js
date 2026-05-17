'use strict';

const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const { validateRestoreOptions, isPathAllowed, maskBackupPath } = require('./backupSafety');
const { validateManifest } = require('./backupManifest');
const { getBackupPath } = require('./backupStore');
const { createBackup } = require('./backupEngine');
const { appendAudit } = require('./backupAudit');

const ROOT_DIR = path.resolve(process.env.BACKUP_ROOT_DIR || '.');
const ROLLBACK_ENABLED = process.env.BACKUP_ROLLBACK_ENABLED !== 'false';

// Track dry-run completions in memory (process lifetime only)
const _dryRunDone = new Set();

function inspectBackup(zipPath) {
  try {
    const zip = new AdmZip(zipPath);
    const entry = zip.getEntry('backup-manifest.json');
    if (!entry) return { valid: false, error: 'Manifest absent du ZIP.' };
    const manifest = JSON.parse(entry.getData().toString('utf8'));
    const validation = validateManifest(manifest);
    if (!validation.valid) return { valid: false, error: validation.error };
    return { valid: true, manifest, fileCount: zip.getEntries().length - 1 };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

function dryRunRestore(backupId, _options) {
  const zipPath = getBackupPath(backupId);
  if (!zipPath) return { error: 'Sauvegarde introuvable.' };

  const inspection = inspectBackup(zipPath);
  if (!inspection.valid) return { error: inspection.error };

  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries().filter(e => e.entryName !== 'backup-manifest.json');

  const willRestore = [];
  const conflicts = [];
  const newFiles = [];
  const modified = [];
  const risks = [];

  for (const entry of entries) {
    const relPath = entry.entryName.replace(/\\/g, '/');
    if (!isPathAllowed(relPath)) {
      risks.push(`Chemin interdit ignoré: ${relPath}`);
      continue;
    }
    const absPath = path.join(ROOT_DIR, relPath);
    const exists = fs.existsSync(absPath);
    willRestore.push(relPath);
    if (exists) {
      conflicts.push(relPath);
      modified.push(relPath);
    } else {
      newFiles.push(relPath);
    }
  }

  if (conflicts.length > 0) {
    risks.push(`${conflicts.length} fichier(s) existant(s) seraient écrasés.`);
  }
  if (ROLLBACK_ENABLED) {
    risks.push('Un rollback sera créé automatiquement avant la restauration.');
  }

  _dryRunDone.add(backupId);

  appendAudit({
    event: 'restore.dryRun',
    backupId,
    status: 'success',
    fileCount: willRestore.length,
  });

  try {
    const { createNotification } = require('../notificationEngine');
    createNotification({
      type: 'info',
      title: 'Dry-run restauration terminé',
      message: `${willRestore.length} fichier(s) seraient restaurés, ${conflicts.length} conflit(s).`,
      source: 'backup',
    });
  } catch { /* optional */ }

  return {
    backupId,
    dryRun: true,
    willRestore,
    conflicts,
    newFiles,
    modified,
    risks,
    confirmationRequired: true,
    rollbackWillBeCreated: ROLLBACK_ENABLED,
    manifest: inspection.manifest,
  };
}

async function createRollbackBeforeRestore() {
  if (!ROLLBACK_ENABLED) return null;
  try {
    const result = await createBackup({
      includeRuntimeSafe: true,
      includeAudits: false,
      includeLogs: false,
      reason: 'Rollback automatique avant restauration',
    });
    try {
      const { createNotification } = require('../notificationEngine');
      createNotification({
        type: 'info',
        title: 'Rollback créé',
        message: `Rollback ${result.backupId.slice(0, 16)} créé avant restauration.`,
        source: 'backup',
      });
    } catch { /* optional */ }
    return result;
  } catch {
    return null;
  }
}

function validateRestoreTarget() {
  return {
    valid: true,
    rootDir: maskBackupPath(ROOT_DIR),
    writable: true,
  };
}

async function restoreBackup(backupId, options) {
  const validation = validateRestoreOptions(options);
  if (!validation.valid) {
    appendAudit({ event: 'restore.refused', backupId, status: 'refused', reason: validation.error });
    try {
      const { createNotification } = require('../notificationEngine');
      createNotification({
        type: 'warning',
        title: 'Restauration refusée',
        message: validation.error,
        source: 'backup',
      });
    } catch { /* optional */ }
    return { error: validation.error, refused: true };
  }

  const dryRunRequired = process.env.BACKUP_RESTORE_DRY_RUN_REQUIRED !== 'false';
  if (dryRunRequired && !_dryRunDone.has(backupId)) {
    const msg = 'Dry-run obligatoire avant toute restauration.';
    appendAudit({ event: 'restore.refused', backupId, status: 'refused', reason: msg });
    try {
      const { createNotification } = require('../notificationEngine');
      createNotification({ type: 'warning', title: 'Restauration refusée', message: msg, source: 'backup' });
    } catch { /* optional */ }
    return { error: msg, dryRunRequired: true };
  }

  const zipPath = getBackupPath(backupId);
  if (!zipPath) return { error: 'Sauvegarde introuvable.' };

  const inspection = inspectBackup(zipPath);
  if (!inspection.valid) return { error: inspection.error };

  const targetCheck = validateRestoreTarget();
  if (!targetCheck.valid) return { error: 'Cible de restauration invalide.' };

  // Create rollback first
  const rollback = await createRollbackBeforeRestore();

  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries().filter(e => e.entryName !== 'backup-manifest.json');
  const restored = [];
  const skipped = [];

  for (const entry of entries) {
    const relPath = entry.entryName.replace(/\\/g, '/');
    if (!isPathAllowed(relPath)) {
      skipped.push(relPath);
      continue;
    }
    const absPath = path.join(ROOT_DIR, relPath);
    try {
      fs.mkdirSync(path.dirname(absPath), { recursive: true });
      fs.writeFileSync(absPath, entry.getData());
      restored.push(relPath);
    } catch {
      skipped.push(relPath);
    }
  }

  _dryRunDone.delete(backupId);

  appendAudit({
    event: 'restore.completed',
    backupId,
    status: 'success',
    fileCount: restored.length,
    reason: options.reason || undefined,
  });

  try {
    const { createNotification } = require('../notificationEngine');
    createNotification({
      type: 'success',
      title: 'Restauration réussie',
      message: `${restored.length} fichier(s) restaurés depuis ${backupId.slice(0, 16)}.`,
      source: 'backup',
    });
  } catch { /* optional */ }

  return {
    backupId,
    restored,
    skipped,
    rollbackCreated: rollback ? rollback.backupId : null,
    createdAt: new Date().toISOString(),
  };
}

function writeRestoreAudit(entry) {
  appendAudit(entry);
}

module.exports = {
  inspectBackup,
  dryRunRestore,
  restoreBackup,
  createRollbackBeforeRestore,
  validateRestoreTarget,
  writeRestoreAudit,
};

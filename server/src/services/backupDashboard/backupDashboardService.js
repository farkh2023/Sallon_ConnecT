'use strict';

const fs      = require('fs');
const path    = require('path');
const runner  = require('./backupScriptRunner');
const safety  = require('./backupDashboardSafety');

const ROOT_DIR      = path.resolve(__dirname, '..', '..', '..', '..');
const SNAPSHOTS_DIR = path.join(ROOT_DIR, 'backups', 'snapshots');

function safeSnapshot(s) {
  return safety.sanitizeBackupResponse({
    id:          s.snapshotId || s.id || '',
    timestamp:   s.timestamp || null,
    type:        s.type || 'unknown',
    description: s.description || '',
    fileCount:   s.fileCount || 0,
    totalSizeKB: s.totalSizeKB || 0,
    valid:       !!s.valid,
    hasChecksum: !!s.hasChecksum,
    hasReport:   !!s.hasReport,
  });
}

async function listBackups() {
  const result = await runner.runListBackups();
  const snapshots = (result.snapshots || []);
  return snapshots.map(safeSnapshot);
}

async function getDashboard() {
  const items = await listBackups();

  let totalSizeKB  = 0;
  let validCount   = 0;
  let corruptCount = 0;
  let incompleteCount = 0;
  let quickCount   = 0;
  let fullCount    = 0;
  let lastBackupAt = null;

  for (const s of items) {
    totalSizeKB += s.totalSizeKB || 0;
    if (s.valid)              validCount++;
    else if (!s.hasChecksum)  incompleteCount++;
    else                      corruptCount++;
    if (s.type === 'quick')   quickCount++;
    if (s.type === 'full')    fullCount++;
    if (!lastBackupAt || (s.timestamp && s.timestamp > lastBackupAt)) lastBackupAt = s.timestamp;
  }

  const totalSizeMB = (totalSizeKB / 1024).toFixed(2);

  return {
    status: 'ok',
    phase:  41,
    summary: {
      total:          items.length,
      valid:          validCount,
      corrupted:      corruptCount,
      incomplete:     incompleteCount,
      quick:          quickCount,
      full:           fullCount,
      totalSizeLabel: `${totalSizeMB} MB`,
      lastBackupAt:   lastBackupAt,
    },
    items:     items.slice(0, 20),
    diagnostic: {
      snapshotsDirExists:  fs.existsSync(SNAPSHOTS_DIR),
      scriptsAvailable:    fs.existsSync(path.join(ROOT_DIR, 'scripts', 'windows', 'backup', 'create-backup.ps1')),
    },
    safety: getSafety(),
  };
}

async function createBackup(options) {
  const type      = options && options.type === 'full' ? 'full' : 'quick';
  const exportZip = !!(options && options.exportZip);
  const result    = await runner.runCreateBackup(type, exportZip);
  return { ok: result.exitCode === 0, type, exportZip };
}

async function verifyBackup(id) {
  const safeId = safety.sanitizeBackupId(id);
  if (!safeId) return { ok: false, error: 'invalid_id', results: [] };
  return runner.runVerifyBackup(safeId);
}

async function exportBackup(id) {
  const safeId = safety.sanitizeBackupId(id);
  if (!safeId) return { ok: false, error: 'invalid_id' };
  return runner.runExportBackup(safeId);
}

async function deleteBackup(id, confirmation) {
  const safeId = safety.sanitizeBackupId(id);
  if (!safeId) return { ok: false, error: 'invalid_id' };
  return runner.runDeleteBackup(safeId, confirmation);
}

function prepareRestore(id) {
  const safeId = safety.sanitizeBackupId(id);
  if (!safeId) return { ok: false, error: 'invalid_id' };
  return {
    ok:          true,
    snapshotId:  safeId,
    warning:     "La restauration ne peut pas etre effectuee automatiquement via l'API.",
    instruction: 'Executez manuellement la commande PowerShell suivante :',
    command:     `.\\scripts\\windows\\backup\\restore-backup.ps1 -SnapshotId ${safeId}`,
    risks: [
      'Les donnees actuelles seront remplacees par celles du snapshot.',
      'Un backup pre-restauration sera cree automatiquement.',
      'Le service et le tray seront arretes pendant la restauration.',
    ],
    localOnly:     true,
    noAutoRestore: true,
  };
}

function getSafety() {
  return {
    localOnly:                       true,
    noCloud:                         true,
    restoreRequiresManualConfirmation: true,
    deleteRequiresConfirmation:      true,
    secretsExcluded:                 true,
    envExcluded:                     true,
    nodeModulesExcluded:             true,
    pathsMasked:                     true,
  };
}

module.exports = {
  getDashboard,
  listBackups,
  createBackup,
  verifyBackup,
  exportBackup,
  deleteBackup,
  prepareRestore,
  getSafety,
};

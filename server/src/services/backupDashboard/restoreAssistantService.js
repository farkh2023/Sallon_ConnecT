'use strict';

const fs     = require('fs');
const path   = require('path');
const safety = require('./restoreAssistantSafety');
const runner = require('./backupScriptRunner');

const ROOT_DIR      = path.resolve(__dirname, '..', '..', '..', '..');
const SNAPSHOTS_DIR = path.join(ROOT_DIR, 'backups', 'snapshots');

const CHECKLIST_ITEMS = [
  { id: 'verified',       label: 'J\'ai verifie que le snapshot est valide' },
  { id: 'replace',        label: 'Je comprends que les donnees actuelles peuvent etre remplacees' },
  { id: 'preBackup',      label: 'Je comprends qu\'un backup pre-restauration sera cree' },
  { id: 'servicePause',   label: 'Je comprends que le service peut etre arrete pendant la restauration' },
  { id: 'manualOnly',     label: 'Je comprends que la restauration se fait uniquement en PowerShell' },
  { id: 'noAutoRestore',  label: 'Je confirme qu\'aucune restauration automatique n\'est lancee par le dashboard' },
];

const WOULD_RESTORE = ['VERSION', 'package.json', 'data/', 'runtime/'];
const WOULD_REPLACE = ['VERSION', 'package.json'];
const WOULD_KEEP    = ['node_modules/', '.next/', 'backups/', 'logs/', '.env'];
const EXCLUDED      = ['.env (jamais copie — marqueur uniquement)', 'node_modules/', '.next/', 'cache/', 'backups/snapshots/'];

function readSnapshotMeta(snapshotId) {
  const dir      = path.join(SNAPSHOTS_DIR, snapshotId);
  const metaPath = path.join(dir, 'metadata.json');
  const ckPath   = path.join(dir, 'checksum.json');

  if (!fs.existsSync(dir)) return null;

  let meta     = {};
  let checksum = {};
  try { meta     = JSON.parse(fs.readFileSync(metaPath, 'utf8')); } catch { /* no meta */ }
  try { checksum = JSON.parse(fs.readFileSync(ckPath,   'utf8')); } catch { /* no checksum */ }

  return {
    id:           snapshotId,
    timestamp:    meta.timestamp    || null,
    type:         meta.type         || 'unknown',
    description:  meta.description  || '',
    fileCount:    meta.fileCount     || Object.keys(checksum).length,
    totalSizeKB:  meta.totalSizeKB  || 0,
    version:      meta.version       || null,
    valid:        !!meta.valid,
    hasChecksum:  Object.keys(checksum).length > 0,
    files:        Object.keys(checksum),
  };
}

async function runVerify(snapshotId) {
  try {
    return await runner.runVerifyBackup(snapshotId);
  } catch {
    return { ok: false, results: [] };
  }
}

async function getAssistantData(snapshotId) {
  const meta = readSnapshotMeta(snapshotId);

  if (!meta) {
    return {
      snapshotId, status: 'blocked',
      snapshot: null, integrity: null, dryRun: null,
      risk: { level: 'blocked', score: 100, reasons: [], blockingReasons: ['Snapshot introuvable.'] },
      checklist: CHECKLIST_ITEMS,
      manualCommand: null,
      safety: safety.ensureRestoreIsManualOnly(),
    };
  }

  const verifyResult = await runVerify(snapshotId);
  const dryRun       = buildDryRun(snapshotId, meta, verifyResult);
  const risk         = safety.buildRestoreRisk(meta, verifyResult, dryRun);
  const isBlocked    = risk.level === 'blocked';

  return safety.sanitizeRestoreAssistantResponse({
    snapshotId,
    status:       isBlocked ? 'blocked' : 'ready',
    snapshot:     meta,
    integrity:    verifyResult,
    dryRun,
    risk,
    checklist:    CHECKLIST_ITEMS,
    manualCommand: isBlocked ? null : safety.buildManualRestoreCommand(snapshotId),
    safety:       safety.ensureRestoreIsManualOnly(),
  });
}

function buildDryRun(snapshotId, meta, verifyResult) {
  const blocked = [];

  if (!meta.valid && !meta.hasChecksum) {
    blocked.push('Snapshot invalide ou sans checksum.');
  }
  if (verifyResult && verifyResult.results) {
    for (const r of verifyResult.results) {
      if (r.missing && r.missing.length > 0)   blocked.push('Fichiers manquants detectes.');
      if (r.corrupted && r.corrupted.length > 0) blocked.push('Fichiers corrompus detectes.');
    }
  }

  const wouldRestore = meta.files && meta.files.length > 0 ? meta.files : WOULD_RESTORE;
  const wouldReplace = wouldRestore.filter(f => !f.startsWith('data/') || true);
  const warnings     = [];

  if (meta.type === 'quick') warnings.push('Backup rapide : logs et scripts non inclus.');
  if (meta.type === 'full')  warnings.push('Backup complet : remplacera davantage de fichiers.');

  return {
    status:    blocked.length > 0 ? 'blocked' : 'ok',
    snapshotId,
    wouldRestore,
    wouldReplace:        WOULD_REPLACE,
    wouldKeep:           WOULD_KEEP,
    excluded:            EXCLUDED,
    preRestoreBackup:    { willBeCreated: true, type: 'quick' },
    warnings,
    blockedReasons:      blocked,
  };
}

async function getDryRun(snapshotId) {
  const meta         = readSnapshotMeta(snapshotId);
  if (!meta) return { status: 'blocked', snapshotId, blockedReasons: ['Snapshot introuvable.'] };
  const verifyResult = await runVerify(snapshotId);
  return safety.sanitizeRestoreAssistantResponse(buildDryRun(snapshotId, meta, verifyResult));
}

async function getRisk(snapshotId) {
  const meta         = readSnapshotMeta(snapshotId);
  if (!meta) return { level: 'blocked', score: 100, reasons: [], blockingReasons: ['Snapshot introuvable.'] };
  const verifyResult = await runVerify(snapshotId);
  const dryRun       = buildDryRun(snapshotId, meta, verifyResult);
  return safety.buildRestoreRisk(meta, verifyResult, dryRun);
}

function getManualCommand(snapshotId) {
  const cmd = safety.buildManualRestoreCommand(snapshotId);
  return {
    manualOnly: true,
    command:    cmd,
    note:       'Cette commande doit etre executee manuellement dans PowerShell.',
    safety:     safety.ensureRestoreIsManualOnly(),
  };
}

module.exports = {
  getAssistantData,
  getDryRun,
  getRisk,
  getManualCommand,
};

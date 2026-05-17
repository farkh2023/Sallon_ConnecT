'use strict';

const fs = require('fs');
const crypto = require('crypto');

function computeFileChecksum(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  } catch {
    return null;
  }
}

function computeBackupChecksum(zipPath) {
  try {
    const content = fs.readFileSync(zipPath);
    return crypto.createHash('sha256').update(content).digest('hex');
  } catch {
    return null;
  }
}

function sizeBucket(bytes) {
  if (bytes < 10_240) return 'small';         // < 10 KB
  if (bytes < 1_048_576) return 'medium';     // < 1 MB
  return 'large';
}

function totalSizeBucket(totalBytes) {
  if (totalBytes < 102_400) return 'small';   // < 100 KB
  if (totalBytes < 10_485_760) return 'medium'; // < 10 MB
  return 'large';
}

function createManifest(files, options) {
  const now = new Date().toISOString();
  const backupId = `backup_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

  let totalBytes = 0;
  const fileEntries = files.map(({ relPath, absPath }) => {
    let bytes = 0;
    let checksum = null;
    try {
      const stat = fs.statSync(absPath);
      bytes = stat.size;
      totalBytes += bytes;
      checksum = computeFileChecksum(absPath);
    } catch { /* file might not exist */ }
    return {
      path: relPath.replace(/\\/g, '/'),
      sizeBucket: sizeBucket(bytes),
      checksum,
    };
  });

  return {
    backupId,
    createdAt: now,
    project: 'Sallon-ConnecT',
    phase: 21,
    mode: 'local',
    profile: options.activeProfileId
      ? String(options.activeProfileId).slice(0, 8) + '…'
      : 'default',
    options: {
      includeRuntimeSafe: options.includeRuntimeSafe !== false,
      includeAudits: options.includeAudits === true,
      includeLogs: options.includeLogs === true,
    },
    summary: {
      fileCount: fileEntries.length,
      totalSizeBucket: totalSizeBucket(totalBytes),
      runtimeIncluded: options.includeRuntimeSafe !== false,
      auditsIncluded: options.includeAudits === true,
      logsIncluded: options.includeLogs === true,
    },
    files: fileEntries,
    security: {
      secretsExcluded: true,
      envExcluded: true,
      nodeModulesExcluded: true,
      logsExcluded: !options.includeLogs,
      pathsMasked: true,
    },
    backupChecksum: null,
  };
}

function validateManifest(manifest) {
  if (!manifest || typeof manifest !== 'object') return { valid: false, error: 'Manifest manquant.' };
  if (!manifest.backupId) return { valid: false, error: 'backupId manquant.' };
  if (!manifest.createdAt) return { valid: false, error: 'createdAt manquant.' };
  if (!Array.isArray(manifest.files)) return { valid: false, error: 'Fichiers manifest invalides.' };
  if (manifest.project !== 'Sallon-ConnecT') return { valid: false, error: 'Projet manifest invalide.' };
  return { valid: true };
}

function summarizeManifest(manifest) {
  return {
    backupId: manifest.backupId ? String(manifest.backupId).slice(0, 20) : undefined,
    createdAt: manifest.createdAt,
    fileCount: manifest.summary ? manifest.summary.fileCount : (manifest.files || []).length,
    totalSizeBucket: manifest.summary ? manifest.summary.totalSizeBucket : undefined,
    runtimeIncluded: manifest.options ? manifest.options.includeRuntimeSafe : false,
    checksumPresent: !!manifest.backupChecksum,
  };
}

module.exports = {
  createManifest,
  computeFileChecksum,
  computeBackupChecksum,
  validateManifest,
  summarizeManifest,
};

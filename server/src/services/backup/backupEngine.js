'use strict';

const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const { isPathAllowed, sanitizeBackupOptions, AUDIT_EXCLUSIONS, maskBackupPath } = require('./backupSafety');
const { createManifest, computeBackupChecksum, validateManifest } = require('./backupManifest');
const { ensureBackupDir, BACKUP_DIR, pruneOldBackups } = require('./backupStore');
const { appendAudit } = require('./backupAudit');

const ROOT_DIR = path.resolve(process.env.BACKUP_ROOT_DIR || '.');
const RUNTIME_DIR = path.resolve(process.env.BACKUP_RUNTIME_DIR || 'runtime');

const ALWAYS_INCLUDE_GLOBS = [
  { dir: 'data', ext: '.json' },
];
const ALWAYS_INCLUDE_FILES = [
  'README.md',
  '.env.example',
  'package.json',
  'frontend/.env.example',
  'frontend/package.json',
];
const OPTIONAL_INCLUDE_FILES = [
  'package-lock.json',
  'frontend/package-lock.json',
];
const DOCS_GLOB = { dir: 'docs', ext: '.md' };
const SCRIPTS_GLOBS = [
  { dir: 'scripts/windows', ext: '.ps1' },
  { dir: 'scripts/windows', ext: '.bat' },
];
const RUNTIME_SAFE_FILES = [
  'active-profile.json',
  'user-profiles.json',
  'schedules.json',
  'observability-snapshots.json',
  'notifications.json',
];

function collectFiles(baseDir, subDir, ext) {
  const results = [];
  const absDir = path.join(baseDir, subDir);
  if (!fs.existsSync(absDir)) return results;
  try {
    for (const file of fs.readdirSync(absDir)) {
      if (file.endsWith(ext)) {
        const relPath = path.join(subDir, file).replace(/\\/g, '/');
        if (isPathAllowed(relPath)) {
          results.push({ relPath, absPath: path.join(absDir, file) });
        }
      }
    }
  } catch { /* skip */ }
  return results;
}

function collectBackupFiles(options) {
  const files = [];
  const seen = new Set();

  function add(relPath, absPath) {
    const norm = relPath.replace(/\\/g, '/');
    if (seen.has(norm)) return;
    if (!isPathAllowed(norm)) return;
    if (options.includeAudits === false && AUDIT_EXCLUSIONS.some(ex => norm.endsWith(ex))) return;
    seen.add(norm);
    files.push({ relPath: norm, absPath });
  }

  // Always-include dirs
  for (const { dir, ext } of ALWAYS_INCLUDE_GLOBS) {
    collectFiles(ROOT_DIR, dir, ext).forEach(f => add(f.relPath, f.absPath));
  }

  // Docs
  collectFiles(ROOT_DIR, DOCS_GLOB.dir, DOCS_GLOB.ext).forEach(f => add(f.relPath, f.absPath));

  // Scripts
  for (const { dir, ext } of SCRIPTS_GLOBS) {
    collectFiles(ROOT_DIR, dir, ext).forEach(f => add(f.relPath, f.absPath));
  }

  // Always-include single files
  for (const rel of ALWAYS_INCLUDE_FILES) {
    const abs = path.join(ROOT_DIR, rel);
    if (fs.existsSync(abs)) add(rel, abs);
  }

  for (const rel of OPTIONAL_INCLUDE_FILES) {
    const abs = path.join(ROOT_DIR, rel);
    if (fs.existsSync(abs)) add(rel, abs);
  }

  // Runtime safe files
  if (options.includeRuntimeSafe !== false) {
    for (const file of RUNTIME_SAFE_FILES) {
      if (options.includeAudits === false && AUDIT_EXCLUSIONS.some(ex => file === ex)) continue;
      const abs = path.join(RUNTIME_DIR, file);
      const rel = `runtime/${file}`;
      if (fs.existsSync(abs)) add(rel, abs);
    }
  }

  // Audit files only if explicitly requested
  if (options.includeAudits === true) {
    for (const file of AUDIT_EXCLUSIONS) {
      const abs = path.join(RUNTIME_DIR, file);
      const rel = `runtime/${file}`;
      if (fs.existsSync(abs)) add(rel, abs);
    }
  }

  return files;
}

function createZip(files, manifest, backupId) {
  ensureBackupDir();
  const zip = new AdmZip();

  for (const { relPath, absPath } of files) {
    try {
      const content = fs.readFileSync(absPath);
      zip.addFile(relPath, content);
    } catch { /* skip unreadable files */ }
  }

  // Add manifest (without checksum first)
  const manifestJson = JSON.stringify(manifest, null, 2);
  zip.addFile('backup-manifest.json', Buffer.from(manifestJson, 'utf8'));

  const fileName = `${backupId}.zip`;
  const zipPath = path.join(BACKUP_DIR, fileName);
  zip.writeZip(zipPath);

  // Compute checksum and update manifest inside zip
  const checksum = computeBackupChecksum(zipPath);
  manifest.backupChecksum = checksum;
  const updatedManifest = JSON.stringify(manifest, null, 2);

  const zip2 = new AdmZip(zipPath);
  zip2.updateFile('backup-manifest.json', Buffer.from(updatedManifest, 'utf8'));
  zip2.writeZip(zipPath);

  return { zipPath, fileName, checksum };
}

function verifyBackup(zipPath) {
  const issues = [];
  try {
    const zip = new AdmZip(zipPath);
    const entry = zip.getEntry('backup-manifest.json');
    if (!entry) {
      issues.push('manifest_missing');
      return { valid: false, issues };
    }
    const manifest = JSON.parse(entry.getData().toString('utf8'));
    const validation = validateManifest(manifest);
    if (!validation.valid) {
      issues.push(`manifest_invalid: ${validation.error}`);
      return { valid: false, issues };
    }
    // Verify individual file checksums (spot-check first 10)
    const crypto = require('crypto');
    const toCheck = (manifest.files || []).slice(0, 10);
    for (const f of toCheck) {
      if (!f.checksum) continue;
      const fileEntry = zip.getEntry(f.path);
      if (!fileEntry) {
        issues.push(`file_missing: ${f.path}`);
        continue;
      }
      const actual = crypto.createHash('sha256').update(fileEntry.getData()).digest('hex');
      if (actual !== f.checksum) {
        issues.push(`checksum_mismatch: ${f.path}`);
      }
    }
    return { valid: issues.length === 0, issues, manifest };
  } catch (err) {
    return { valid: false, issues: [`zip_error: ${err.message}`] };
  }
}

async function createBackup(options) {
  const safeOptions = sanitizeBackupOptions(options);
  ensureBackupDir();

  let activeProfileId = null;
  try {
    const { getActiveProfile } = require('../profiles/profileStore');
    const active = getActiveProfile();
    if (active) activeProfileId = active.id;
  } catch { /* profiles not available */ }

  const files = collectBackupFiles(safeOptions);

  const manifest = createManifest(files, { ...safeOptions, activeProfileId });

  const { zipPath, fileName, checksum } = createZip(files, manifest, manifest.backupId);

  appendAudit({
    event: 'backup.created',
    backupId: manifest.backupId,
    status: 'success',
    reason: safeOptions.reason,
    fileCount: files.length,
    sizeBucket: manifest.summary.totalSizeBucket,
  });

  const pruneResult = pruneOldBackups();

  try {
    const { createNotification } = require('../notificationEngine');
    createNotification({
      type: 'info',
      title: 'Sauvegarde créée',
      message: `Sauvegarde ${manifest.backupId.slice(0, 16)} créée (${files.length} fichiers).`,
      source: 'backup',
    });
  } catch { /* notifications optional */ }

  return {
    backupId: manifest.backupId,
    fileName,
    filePath: maskBackupPath(zipPath),
    checksum,
    createdAt: manifest.createdAt,
    manifestSummary: manifest.summary,
    pruned: pruneResult.pruned,
  };
}

module.exports = {
  collectBackupFiles,
  createZip,
  verifyBackup,
  createBackup,
};

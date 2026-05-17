'use strict';

const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const { maskBackupPath } = require('./backupSafety');

const BACKUP_DIR = path.resolve(process.env.BACKUP_STORE_DIR || 'backups');
const MAX_ITEMS = parseInt(process.env.BACKUP_MAX_ITEMS || '20', 10);

function ensureBackupDir() {
  try {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  } catch { /* ignore */ }
}

function listBackups() {
  ensureBackupDir();
  try {
    const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.zip'));
    const infos = [];
    for (const file of files) {
      const zipPath = path.join(BACKUP_DIR, file);
      try {
        const stat = fs.statSync(zipPath);
        let manifest = null;
        try {
          const zip = new AdmZip(zipPath);
          const entry = zip.getEntry('backup-manifest.json');
          if (entry) manifest = JSON.parse(entry.getData().toString('utf8'));
        } catch { /* corrupt zip */ }
        infos.push({
          backupId: manifest ? manifest.backupId : file.replace('.zip', ''),
          fileName: file,
          filePath: maskBackupPath(zipPath),
          createdAt: manifest ? manifest.createdAt : stat.mtime.toISOString(),
          summary: manifest ? manifest.summary : null,
          checksumPresent: !!(manifest && manifest.backupChecksum),
        });
      } catch { /* skip */ }
    }
    infos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return infos;
  } catch {
    return [];
  }
}

function getBackupPath(backupId) {
  ensureBackupDir();
  const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.zip'));
  const match = files.find(f => f.includes(backupId));
  if (!match) return null;
  return path.join(BACKUP_DIR, match);
}

function getBackupInfo(backupId) {
  const zipPath = getBackupPath(backupId);
  if (!zipPath) return null;
  try {
    const stat = fs.statSync(zipPath);
    let manifest = null;
    try {
      const zip = new AdmZip(zipPath);
      const entry = zip.getEntry('backup-manifest.json');
      if (entry) manifest = JSON.parse(entry.getData().toString('utf8'));
    } catch { /* corrupt */ }
    return {
      backupId: manifest ? manifest.backupId : backupId,
      fileName: path.basename(zipPath),
      filePath: maskBackupPath(zipPath),
      sizeBytes: stat.size,
      createdAt: manifest ? manifest.createdAt : stat.mtime.toISOString(),
      manifest,
    };
  } catch {
    return null;
  }
}

function deleteBackup(backupId) {
  const zipPath = getBackupPath(backupId);
  if (!zipPath) throw new Error('Sauvegarde introuvable.');
  fs.unlinkSync(zipPath);
  return { deleted: true, backupId };
}

function getBackupStats() {
  const backups = listBackups();
  return {
    count: backups.length,
    maxItems: MAX_ITEMS,
    latest: backups[0] || null,
    backupDir: maskBackupPath(BACKUP_DIR),
  };
}

function pruneOldBackups() {
  ensureBackupDir();
  const backups = listBackups();
  const pruned = [];
  if (backups.length > MAX_ITEMS) {
    const toDelete = backups.slice(MAX_ITEMS);
    for (const b of toDelete) {
      try {
        const zipPath = path.join(BACKUP_DIR, b.fileName);
        fs.unlinkSync(zipPath);
        pruned.push(b.backupId);
      } catch { /* ignore */ }
    }
  }
  return { pruned, remaining: Math.min(backups.length, MAX_ITEMS) };
}

module.exports = {
  ensureBackupDir,
  listBackups,
  getBackupPath,
  getBackupInfo,
  deleteBackup,
  getBackupStats,
  pruneOldBackups,
  BACKUP_DIR,
};

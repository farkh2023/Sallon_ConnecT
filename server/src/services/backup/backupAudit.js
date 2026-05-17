'use strict';

const fs = require('fs');
const path = require('path');
const { maskSensitiveText } = require('./backupSafety');

const AUDIT_PATH = path.resolve(process.env.BACKUP_AUDIT_PATH || 'runtime/backup-audit.json');
const MAX_ENTRIES = 200;

function ensureAuditFile() {
  try {
    if (!fs.existsSync(AUDIT_PATH)) {
      fs.mkdirSync(path.dirname(AUDIT_PATH), { recursive: true });
      fs.writeFileSync(AUDIT_PATH, '[]', 'utf8');
    }
  } catch { /* ignore */ }
}

function loadAudit() {
  try {
    ensureAuditFile();
    const raw = fs.readFileSync(AUDIT_PATH, 'utf8');
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

function appendAudit(entry) {
  try {
    const entries = loadAudit();
    const safe = {
      at: new Date().toISOString(),
      event: String(entry.event || 'unknown').slice(0, 40),
      backupId: entry.backupId ? String(entry.backupId).slice(0, 20) : undefined,
      status: entry.status || undefined,
      reason: entry.reason ? maskSensitiveText(String(entry.reason).slice(0, 80)) : undefined,
      fileCount: typeof entry.fileCount === 'number' ? entry.fileCount : undefined,
      sizeBucket: entry.sizeBucket || undefined,
    };
    entries.unshift(safe);
    const trimmed = entries.slice(0, MAX_ENTRIES);
    fs.mkdirSync(path.dirname(AUDIT_PATH), { recursive: true });
    fs.writeFileSync(AUDIT_PATH, JSON.stringify(trimmed, null, 2), 'utf8');
  } catch { /* ignore */ }
}

function listAudit() {
  return loadAudit();
}

function clearAudit() {
  try {
    fs.writeFileSync(AUDIT_PATH, '[]', 'utf8');
  } catch { /* ignore */ }
  return { cleared: true };
}

module.exports = { loadAudit, appendAudit, listAudit, clearAudit };

'use strict';

const BACKUP_ID_REGEX = /^[A-Za-z0-9_\-.]{1,64}$/;
const FORBIDDEN_ID = ['..', './', '\\', '/'];
const SENSITIVE_PATTERNS = [
  /[A-Z]:\\Users\\/gi,
  /\/home\/[^/]+\//gi,
  /\.env/gi,
  /Bearer\s+/gi,
  /password/gi,
  /secret/gi,
  /token[=:]/gi,
];

function sanitizeBackupId(id) {
  if (!id || typeof id !== 'string') return null;
  if (id.includes('..') || id.includes('/') || id.includes('\\')) return null;
  if (!BACKUP_ID_REGEX.test(id)) return null;
  return id;
}

function validateBackupAction(action) {
  return ['create', 'verify', 'export', 'delete', 'prepare-restore', 'list'].includes(action);
}

function maskBackupPath(text) {
  if (!text || typeof text !== 'string') return text;
  return text
    .replace(/[A-Z]:\\Users\\[^\\]+\\/gi, '<user>\\')
    .replace(/\/home\/[^/]+\//gi, '<home>/')
    .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/g, 'Bearer <masked>')
    .replace(/token[=:]\s*["']?[A-Za-z0-9\-._~+/]{8,}["']?/gi, 'token=<masked>');
}

function sanitizeBackupResponse(data) {
  if (!data) return data;
  try {
    const str = JSON.stringify(data);
    const masked = maskBackupPath(str);
    return JSON.parse(masked);
  } catch {
    return data;
  }
}

function ensureNoSensitiveData(data) {
  if (!data) return true;
  try {
    const str = JSON.stringify(data).toLowerCase();
    const forbidden = ['c:\\users\\', '.env', 'bearer ', 'password', 'secret'];
    return !forbidden.some(f => str.includes(f));
  } catch {
    return false;
  }
}

function buildSafeBackupDashboardError(_err) {
  return {
    error: 'backup_operation_failed',
    message: "L'operation de sauvegarde a echoue.",
    details: null,
  };
}

module.exports = {
  sanitizeBackupId,
  validateBackupAction,
  maskBackupPath,
  sanitizeBackupResponse,
  ensureNoSensitiveData,
  buildSafeBackupDashboardError,
};

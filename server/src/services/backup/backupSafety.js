'use strict';

const path = require('path');

const FORBIDDEN_PATTERNS = [
  /^\.git(\/|$)/,
  /node_modules(\/|$)/,
  /^\.next(\/|$)/,
  /frontend[/\\]\.next(\/|$)/,
  /^\.env$/,
  /^\.env\./,
  /frontend[/\\]\.env\.local$/,
  /\.(pem|key|crt|p12|pfx)$/i,
  /^logs[/\\].*\.(log|txt|json)$/,
  /^dist[/\\].*\.zip$/,
  /\.(tmp|temp|swp|bak)$/i,
  /~$/,
  /Thumbs\.db$/i,
  /\.DS_Store$/,
];

const SENSITIVE_CONTENT_PATTERNS = [
  /Bearer\s+\S+/gi,
  /token[=:]\s*\S{8,}/gi,
  /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
  /[A-Za-z]:[\\\/][^\s"',]{30,}/g,
  /\/(?:home|var|usr|etc)\/[^\s"',]{15,}/g,
];

const AUDIT_EXCLUSIONS = [
  'smartthings-scene-audit.json',
  'smartthings-tv-audit.json',
  'media-streaming-audit.json',
  'profile-audit.json',
  'backup-audit.json',
];

function isForbiddenPath(relPath) {
  const normalized = relPath.replace(/\\/g, '/');
  return FORBIDDEN_PATTERNS.some(pattern => pattern.test(normalized));
}

function isPathAllowed(relPath) {
  return !isForbiddenPath(relPath);
}

function maskBackupPath(fullPath) {
  if (!fullPath || typeof fullPath !== 'string') return '[path]';
  const normalized = fullPath.replace(/\\/g, '/');
  const parts = normalized.split('/');
  if (parts.length > 3) {
    return '…/' + parts.slice(-2).join('/');
  }
  return parts.slice(-1)[0] || '[path]';
}

function maskSensitiveText(text) {
  if (typeof text !== 'string') return text;
  let out = text;
  for (const pat of SENSITIVE_CONTENT_PATTERNS) {
    out = out.replace(pat, '[masked]');
  }
  return out;
}

function sanitizeBackupOptions(input) {
  if (!input || typeof input !== 'object') return {};
  return {
    includeRuntimeSafe: input.includeRuntimeSafe !== false,
    includeAudits: input.includeAudits === true,
    includeLogs: input.includeLogs === true,
    reason: typeof input.reason === 'string'
      ? maskSensitiveText(input.reason.trim().slice(0, 100))
      : 'Sauvegarde manuelle',
  };
}

function validateBackupOptions(options) {
  if (!options || typeof options !== 'object') return { valid: true };
  if (typeof options.includeRuntimeSafe !== 'boolean' && options.includeRuntimeSafe !== undefined) {
    return { valid: false, error: 'includeRuntimeSafe doit être un booléen.' };
  }
  return { valid: true };
}

function validateRestoreOptions(options) {
  if (!options || typeof options !== 'object') {
    return { valid: false, error: 'Options de restauration manquantes.' };
  }
  const confirmationCode = process.env.BACKUP_CONFIRMATION_CODE || 'CONFIRMER_BACKUP';
  if (!options.confirmationCode || options.confirmationCode !== confirmationCode) {
    return { valid: false, error: 'Code de confirmation incorrect ou manquant.' };
  }
  return { valid: true };
}

function sanitizeManifestForResponse(manifest) {
  if (!manifest || typeof manifest !== 'object') return {};
  return {
    backupId: manifest.backupId ? String(manifest.backupId).slice(0, 20) : undefined,
    createdAt: manifest.createdAt,
    project: manifest.project,
    phase: manifest.phase,
    mode: manifest.mode,
    profile: manifest.profile,
    options: manifest.options || {},
    summary: manifest.summary || {},
    files: Array.isArray(manifest.files)
      ? manifest.files.map(f => ({
          path: f.path ? String(f.path).replace(/\\/g, '/') : undefined,
          sizeBucket: f.sizeBucket,
          checksum: f.checksum ? String(f.checksum).slice(0, 16) + '…' : undefined,
        }))
      : [],
    security: manifest.security || {},
    backupChecksum: manifest.backupChecksum
      ? String(manifest.backupChecksum).slice(0, 16) + '…'
      : undefined,
  };
}

function buildSafeBackupError(error) {
  return {
    status: 'error',
    error: 'Opération backup échouée de manière sécurisée.',
    localOnly: true,
    secretsMasked: true,
    message: error && typeof error.message === 'string'
      ? maskSensitiveText(error.message.slice(0, 120))
      : undefined,
  };
}

module.exports = {
  isForbiddenPath,
  isPathAllowed,
  maskBackupPath,
  maskSensitiveText,
  sanitizeBackupOptions,
  validateBackupOptions,
  validateRestoreOptions,
  sanitizeManifestForResponse,
  buildSafeBackupError,
  AUDIT_EXCLUSIONS,
  FORBIDDEN_PATTERNS,
};

'use strict';

const SECRET_PATTERNS = [
  /Bearer\s+\S+/gi,
  /api[_-]?key\s*[:=]\s*\S+/gi,
  /token\s*[:=]\s*\S+/gi,
  /password\s*[:=]\s*\S+/gi,
  /secret\s*[:=]\s*\S+/gi,
  /C:\\Users\\\S+/gi,
  /\/home\/\S+/gi,
];

const WINDOWS_RESERVED_IDS = new Set([
  'con', 'prn', 'aux', 'nul',
  'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9',
  'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9',
]);

function maskSecrets(text) {
  if (typeof text !== 'string') return text;
  let out = text;
  for (const re of SECRET_PATTERNS) out = out.replace(re, '[MASQUE]');
  return out;
}

function validateWorkspaceId(id) {
  if (typeof id !== 'string') return false;
  if (!/^[a-zA-Z0-9_-]{1,40}$/.test(id)) return false;
  if (id.includes('..') || id.includes('/') || id.includes('\\')) return false;
  if (id.startsWith('-') || id.endsWith('-') || id.endsWith('_')) return false;
  if (WINDOWS_RESERVED_IDS.has(id.toLowerCase())) return false;
  return true;
}

function sanitizeProfile(profile) {
  return {
    ...profile,
    name:        maskSecrets(String(profile.name || '').trim()),
    description: maskSecrets(String(profile.description || '').trim()),
    localOnly:   true,
  };
}

function sanitizeForExport(profile) {
  const { id, name, description, createdAt, updatedAt, isDefault, settings } = profile;
  return {
    id, name: maskSecrets(name),
    description: maskSecrets(description || ''),
    createdAt, updatedAt, isDefault,
    settings: { ...settings },
    localOnly: true,
    exportedAt: new Date().toISOString(),
  };
}

function getWorkspaceSafety() {
  return {
    localOnly:                     true,
    noCloudAllowed:                true,
    secretMaskingEnabled:          true,
    pathTraversalBlocked:          true,
    deleteCurrentBlocked:          true,
    deleteDefaultRequiresConfirm:  true,
    exportSanitized:               true,
    importStrictValidation:        true,
  };
}

module.exports = { maskSecrets, validateWorkspaceId, sanitizeProfile, sanitizeForExport, getWorkspaceSafety };

'use strict';

const PLUGIN_ID_REGEX = /^[A-Za-z0-9_\-.]{1,64}$/;

const ALLOWED_PERMISSIONS = [
  'read:diagnostics',
  'read:backups',
  'read:notifications',
  'read:scheduler',
  'ai-read',
  'ai-chat',
  'ai-diagnostics',
];

function sanitizePluginId(id) {
  if (!id || typeof id !== 'string') return null;
  if (id.includes('..') || id.includes('/') || id.includes('\\')) return null;
  if (!PLUGIN_ID_REGEX.test(id)) return null;
  return id;
}

function validateManifest(manifest) {
  if (!manifest || typeof manifest !== 'object') {
    return { ok: false, error: 'manifest manquant' };
  }
  if (!sanitizePluginId(manifest.id)) {
    return { ok: false, error: 'id invalide' };
  }
  if (!manifest.name || typeof manifest.name !== 'string') {
    return { ok: false, error: 'name invalide' };
  }
  if (!manifest.version || typeof manifest.version !== 'string') {
    return { ok: false, error: 'version invalide' };
  }
  if (manifest.localOnly !== true) {
    return { ok: false, error: 'localOnly requis (doit etre true)' };
  }
  if (!Array.isArray(manifest.permissions)) {
    return { ok: false, error: 'permissions doit etre un tableau' };
  }
  for (const p of manifest.permissions) {
    if (!ALLOWED_PERMISSIONS.includes(p)) {
      return { ok: false, error: `permission non autorisee : ${p}` };
    }
  }
  return { ok: true, error: null };
}

function getPluginSafety() {
  return {
    localOnly:              true,
    noNetworkByDefault:     true,
    noAutoInstall:          true,
    noCloudSync:            true,
    permissionsAllowlist:   ALLOWED_PERMISSIONS,
    errorIsolation:         true,
    manualApprovalRequired: true,
  };
}

module.exports = { sanitizePluginId, validateManifest, getPluginSafety, ALLOWED_PERMISSIONS };

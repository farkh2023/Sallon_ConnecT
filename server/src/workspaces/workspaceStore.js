'use strict';

const fs   = require('fs');
const path = require('path');
const { validateProfile, DEFAULT_SETTINGS, MAX_COUNT, DEFAULT_ID, normalizeSettings } = require('./workspaceTypes');
const { sanitizeProfile, validateWorkspaceId } = require('./workspaceSafety');

const WS_DIR      = path.join(process.cwd(), 'runtime', 'workspaces');
const PROFILES_F  = path.join(WS_DIR, 'profiles.json');
const CURRENT_F   = path.join(WS_DIR, 'current.json');

function _ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function _ensureWorkspaceDir(id) {
  if (!validateWorkspaceId(id)) throw new Error('id_invalide');
  const sub = path.join(WS_DIR, id);
  _ensureDir(sub);
  for (const d of ['memory', 'rag', 'knowledge', 'workflows', 'agents', 'dashboards', 'search-history']) {
    _ensureDir(path.join(sub, d));
  }
  const pluginsF = path.join(sub, 'plugins.json');
  if (!fs.existsSync(pluginsF)) fs.writeFileSync(pluginsF, JSON.stringify({ enabled: {}, localOnly: true }, null, 2), 'utf8');
  const metaF = path.join(sub, 'metadata.json');
  if (!fs.existsSync(metaF)) {
    fs.writeFileSync(metaF, JSON.stringify({ id, createdAt: new Date().toISOString() }, null, 2), 'utf8');
  }
  const settF = path.join(sub, 'settings.json');
  if (!fs.existsSync(settF)) {
    fs.writeFileSync(settF, JSON.stringify({ ...DEFAULT_SETTINGS }, null, 2), 'utf8');
  }
}

function _writeWorkspaceSettings(id, settings) {
  _ensureWorkspaceDir(id);
  const settF = path.join(getWorkspaceDir(id), 'settings.json');
  fs.writeFileSync(settF, JSON.stringify(normalizeSettings(settings || {}), null, 2), 'utf8');
}

let _profiles = null;

function _loadProfiles() {
  if (_profiles) return _profiles;
  _ensureDir(WS_DIR);
  if (!fs.existsSync(PROFILES_F)) {
    const def = _makeDefault();
    _profiles = [def];
    _saveProfiles(_profiles);
    return _profiles;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(PROFILES_F, 'utf8'));
    _profiles = Array.isArray(parsed) ? parsed.filter(p => validateProfile(p).valid) : [_makeDefault()];
  } catch { _profiles = [_makeDefault()]; }
  if (!_profiles.find(p => p.id === DEFAULT_ID())) _profiles.unshift(_makeDefault());
  return _profiles;
}

function _makeDefault() {
  const now = new Date().toISOString();
  return {
    id: DEFAULT_ID(), name: 'Profil principal', description: 'Espace local par defaut',
    createdAt: now, updatedAt: now, isDefault: true, localOnly: true,
    settings: { ...DEFAULT_SETTINGS },
  };
}

function _saveProfiles(profiles) {
  _ensureDir(WS_DIR);
  fs.writeFileSync(PROFILES_F, JSON.stringify(profiles, null, 2), 'utf8');
}

function getCurrentId() {
  _ensureDir(WS_DIR);
  if (!fs.existsSync(CURRENT_F)) return DEFAULT_ID();
  try {
    const id = JSON.parse(fs.readFileSync(CURRENT_F, 'utf8')).id || DEFAULT_ID();
    return validateWorkspaceId(id) ? id : DEFAULT_ID();
  } catch { return DEFAULT_ID(); }
}

function setCurrentId(id) {
  if (!validateWorkspaceId(id)) throw new Error('id_invalide');
  _ensureDir(WS_DIR);
  fs.writeFileSync(CURRENT_F, JSON.stringify({ id, switchedAt: new Date().toISOString() }, null, 2), 'utf8');
}

function listProfiles() {
  return _loadProfiles();
}

function getProfile(id) {
  return _loadProfiles().find(p => p.id === id) || null;
}

function createProfile(data) {
  const profiles = _loadProfiles();
  if (profiles.length >= MAX_COUNT()) throw new Error('workspace_max_count_reached');
  if (profiles.find(p => p.id === data.id)) throw new Error('workspace_id_exists');
  if (!validateWorkspaceId(data.id)) throw new Error('id_invalide');
  const v = validateProfile(data);
  if (!v.valid) throw new Error(`validation: ${v.errors.join(', ')}`);
  const now = new Date().toISOString();
  const profile = sanitizeProfile({
    ...data, createdAt: now, updatedAt: now,
    isDefault: false, localOnly: true,
    settings: normalizeSettings(data.settings || {}),
  });
  profiles.push(profile);
  _profiles = profiles;
  _saveProfiles(profiles);
  _ensureWorkspaceDir(profile.id);
  _writeWorkspaceSettings(profile.id, profile.settings);
  return profile;
}

function updateProfile(id, updates) {
  if (!validateWorkspaceId(id)) throw new Error('id_invalide');
  const profiles = _loadProfiles();
  const idx = profiles.findIndex(p => p.id === id);
  if (idx < 0) return null;
  const merged = sanitizeProfile({
    ...profiles[idx], ...updates,
    id, updatedAt: new Date().toISOString(), localOnly: true,
    settings: normalizeSettings({ ...(profiles[idx].settings || {}), ...(updates.settings || {}) }),
  });
  const v = validateProfile(merged);
  if (!v.valid) throw new Error(`validation: ${v.errors.join(', ')}`);
  profiles[idx] = merged;
  _profiles = profiles;
  _saveProfiles(profiles);
  _writeWorkspaceSettings(id, merged.settings);
  return merged;
}

function deleteProfile(id, { confirmation } = {}) {
  if (!validateWorkspaceId(id)) return { ok: false, error: 'id_invalide' };
  const profiles = _loadProfiles();
  const target   = profiles.find(p => p.id === id);
  if (!target) return { ok: false, error: 'workspace_introuvable' };
  if (target.isDefault) {
    if (confirmation !== 'SUPPRIMER_WORKSPACE_DEFAULT') {
      return { ok: false, error: 'confirmation_default_requise: SUPPRIMER_WORKSPACE_DEFAULT' };
    }
  }
  const current = getCurrentId();
  if (current === id) return { ok: false, error: 'impossible_supprimer_workspace_courant' };
  const updated = profiles.filter(p => p.id !== id);
  _profiles = updated;
  _saveProfiles(updated);
  const dir = getWorkspaceDir(id);
  const root = path.resolve(WS_DIR);
  const resolved = path.resolve(dir);
  if (resolved.startsWith(root + path.sep) && fs.existsSync(resolved)) {
    fs.rmSync(resolved, { recursive: true, force: true });
  }
  return { ok: true };
}

function getWorkspaceDir(id) {
  if (!validateWorkspaceId(id)) throw new Error('id_invalide');
  const resolved = path.resolve(WS_DIR, id);
  const root = path.resolve(WS_DIR);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) throw new Error('path_traversal_bloque');
  return resolved;
}

function invalidateCache() {
  _profiles = null;
}

// Ensure default workspace exists on startup
function init() {
  const profiles = _loadProfiles();
  const defId = DEFAULT_ID();
  if (!profiles.find(p => p.id === defId)) {
    profiles.unshift(_makeDefault());
    _profiles = profiles;
    _saveProfiles(profiles);
  }
  _ensureWorkspaceDir(defId);
  for (const profile of profiles) _ensureWorkspaceDir(profile.id);
}

module.exports = {
  listProfiles, getProfile, createProfile, updateProfile, deleteProfile,
  getCurrentId, setCurrentId, getWorkspaceDir, invalidateCache, init,
};

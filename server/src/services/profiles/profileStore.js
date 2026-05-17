'use strict';

const fs = require('fs');
const path = require('path');
const { sanitizeProfile, sanitizeProfileForResponse, maskProfileSensitiveData } = require('./profileSafety');
const { getDefaultPermissions } = require('./profilePermissions');

function isEnabled() { return process.env.PROFILES_ENABLED !== 'false'; }
function getStorePath() { return path.resolve(process.env.PROFILES_STORE_PATH || 'runtime/user-profiles.json'); }
function getActivePath() { return path.resolve(process.env.PROFILES_ACTIVE_PATH || 'runtime/active-profile.json'); }
function getMaxItems() { return Math.min(parseInt(process.env.PROFILES_MAX_ITEMS || '10', 10), 20); }
function getDefaultId() { return process.env.PROFILES_DEFAULT_PROFILE_ID || 'main'; }

function ensureFile(filePath, defaultContent) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2), 'utf8');
    }
  } catch { /* ignore */ }
}

function loadProfiles() {
  try {
    const storePath = getStorePath();
    ensureFile(storePath, []);
    const raw = fs.readFileSync(storePath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveProfiles(items) {
  if (!isEnabled()) return;
  try {
    const storePath = getStorePath();
    fs.mkdirSync(path.dirname(storePath), { recursive: true });
    fs.writeFileSync(storePath, JSON.stringify(items, null, 2), 'utf8');
  } catch { /* ignore */ }
}

function getProfile(id) {
  const profiles = loadProfiles();
  return profiles.find(p => p.id === id) || null;
}

function createProfile(input) {
  const profiles = loadProfiles();
  const maxItems = getMaxItems();
  if (profiles.length >= maxItems) {
    throw new Error(`Nombre maximum de profils atteint (${maxItems}).`);
  }
  const sanitized = sanitizeProfile(input);
  if (!sanitized.name) throw new Error('Nom de profil requis.');

  const id = `profile_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();
  const defaultPerms = getDefaultPermissions(sanitized.type || 'guest');

  const profile = {
    id,
    name: sanitized.name,
    type: sanitized.type || 'guest',
    enabled: sanitized.enabled !== false,
    createdAt: now,
    updatedAt: now,
    preferences: {
      theme: 'dark',
      accentColor: 'blue',
      defaultView: 'dashboard',
      tvModeDefault: false,
      compactMode: false,
      language: 'fr',
      refreshIntervalSeconds: 30,
      visibleSections: ['dashboard', 'devices', 'media', 'scenarios', 'notifications', 'scheduler', 'observability'],
      ...sanitized.preferences,
    },
    permissions: { ...defaultPerms, ...sanitized.permissions },
    safety: {
      sensitiveActionsRequireConfirmation: true,
      hideSensitivePanels: sanitized.type === 'guest',
      readOnlyMode: sanitized.type === 'guest',
      ...sanitized.safety,
    },
  };

  profiles.push(profile);
  saveProfiles(profiles);
  return profile;
}

function updateProfile(id, patch) {
  const profiles = loadProfiles();
  const idx = profiles.findIndex(p => p.id === id);
  if (idx === -1) throw new Error('Profil introuvable.');

  const existing = profiles[idx];
  const sanitized = sanitizeProfile({ ...existing, ...patch });

  profiles[idx] = {
    ...existing,
    name: sanitized.name || existing.name,
    type: existing.type,
    enabled: sanitized.enabled !== undefined ? sanitized.enabled : existing.enabled,
    updatedAt: new Date().toISOString(),
    preferences: { ...existing.preferences, ...sanitized.preferences },
    permissions: { ...existing.permissions, ...sanitized.permissions },
    safety: { ...existing.safety, ...sanitized.safety },
  };

  saveProfiles(profiles);
  return profiles[idx];
}

function deleteProfile(id) {
  if (id === getDefaultId() || id === 'main') {
    throw new Error('Le profil principal ne peut pas être supprimé.');
  }
  const profiles = loadProfiles();
  const idx = profiles.findIndex(p => p.id === id);
  if (idx === -1) throw new Error('Profil introuvable.');

  profiles.splice(idx, 1);
  saveProfiles(profiles);

  const active = getActiveProfile();
  if (active && active.id === id) {
    setActiveProfile(getDefaultId());
  }

  return { deleted: true };
}

function getActiveProfile() {
  try {
    const activePath = getActivePath();
    const defaultId = getDefaultId();
    ensureFile(activePath, { id: defaultId });
    const raw = fs.readFileSync(activePath, 'utf8');
    const parsed = JSON.parse(raw);
    const id = parsed && parsed.id ? String(parsed.id) : defaultId;
    return getProfile(id);
  } catch {
    return getProfile(getDefaultId());
  }
}

function setActiveProfile(id) {
  const profile = getProfile(id);
  if (!profile) throw new Error('Profil introuvable.');
  try {
    const activePath = getActivePath();
    fs.mkdirSync(path.dirname(activePath), { recursive: true });
    fs.writeFileSync(activePath, JSON.stringify({ id, activatedAt: new Date().toISOString() }, null, 2), 'utf8');
  } catch { /* ignore */ }
  return profile;
}

function resetProfiles() {
  saveProfiles([]);
  try {
    fs.writeFileSync(getActivePath(), JSON.stringify({ id: getDefaultId() }, null, 2), 'utf8');
  } catch { /* ignore */ }
}

function getProfileStats() {
  const profiles = loadProfiles();
  const active = getActiveProfile();
  const byType = {};
  for (const p of profiles) {
    byType[p.type] = (byType[p.type] || 0) + 1;
  }
  return {
    total: profiles.length,
    enabled: profiles.filter(p => p.enabled).length,
    disabled: profiles.filter(p => !p.enabled).length,
    activeProfileId: active ? active.id : null,
    activeProfileName: active ? maskProfileSensitiveData(active.name || '') : null,
    activeProfileType: active ? active.type : null,
    byType,
    maxProfiles: getMaxItems(),
  };
}

module.exports = {
  loadProfiles,
  saveProfiles,
  getProfile,
  createProfile,
  updateProfile,
  deleteProfile,
  getActiveProfile,
  setActiveProfile,
  resetProfiles,
  getProfileStats,
  sanitizeProfileForResponse,
};

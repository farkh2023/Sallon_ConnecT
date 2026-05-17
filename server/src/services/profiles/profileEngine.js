'use strict';

const fs = require('fs');
const path = require('path');
const profileStore = require('./profileStore');
const { getDefaultPermissions } = require('./profilePermissions');
const { maskProfileSensitiveData } = require('./profileSafety');

function isAuditEnabled() { return process.env.PROFILES_AUDIT_ENABLED !== 'false'; }
function getAuditPath() { return path.resolve(process.env.PROFILES_AUDIT_PATH || 'runtime/profile-audit.json'); }
const MAX_AUDIT = 200;

const DEFAULT_PROFILES_SPEC = [
  {
    id: 'main',
    name: 'Profil principal',
    type: 'owner',
    enabled: true,
    preferences: {
      theme: 'dark',
      accentColor: 'blue',
      defaultView: 'dashboard',
      tvModeDefault: false,
      compactMode: false,
      language: 'fr',
      refreshIntervalSeconds: 30,
      visibleSections: ['dashboard', 'devices', 'media', 'scenarios', 'notifications', 'scheduler', 'observability'],
    },
    safetyOverrides: {
      sensitiveActionsRequireConfirmation: true,
      hideSensitivePanels: false,
      readOnlyMode: false,
    },
  },
  {
    id: 'family',
    name: 'Profil Famille',
    type: 'family',
    enabled: true,
    preferences: {
      theme: 'dark',
      accentColor: 'green',
      defaultView: 'dashboard',
      tvModeDefault: false,
      compactMode: false,
      language: 'fr',
      refreshIntervalSeconds: 60,
      visibleSections: ['dashboard', 'media', 'scenarios', 'notifications'],
    },
    safetyOverrides: {
      sensitiveActionsRequireConfirmation: true,
      hideSensitivePanels: true,
      readOnlyMode: false,
    },
  },
  {
    id: 'guest',
    name: 'Profil Invité',
    type: 'guest',
    enabled: true,
    preferences: {
      theme: 'dark',
      accentColor: 'slate',
      defaultView: 'dashboard',
      tvModeDefault: false,
      compactMode: true,
      language: 'fr',
      refreshIntervalSeconds: 60,
      visibleSections: ['dashboard', 'media'],
    },
    safetyOverrides: {
      sensitiveActionsRequireConfirmation: true,
      hideSensitivePanels: true,
      readOnlyMode: true,
    },
  },
  {
    id: 'tv',
    name: 'Profil TV',
    type: 'tv',
    enabled: true,
    preferences: {
      theme: 'dark',
      accentColor: 'blue',
      defaultView: 'dashboard',
      tvModeDefault: true,
      compactMode: false,
      language: 'fr',
      refreshIntervalSeconds: 30,
      visibleSections: ['dashboard', 'media', 'notifications'],
    },
    safetyOverrides: {
      sensitiveActionsRequireConfirmation: true,
      hideSensitivePanels: true,
      readOnlyMode: false,
    },
  },
  {
    id: 'diagnostic',
    name: 'Profil Diagnostic',
    type: 'diagnostic',
    enabled: true,
    preferences: {
      theme: 'dark',
      accentColor: 'orange',
      defaultView: 'observability',
      tvModeDefault: false,
      compactMode: false,
      language: 'fr',
      refreshIntervalSeconds: 15,
      visibleSections: ['dashboard', 'notifications', 'scheduler', 'observability'],
    },
    safetyOverrides: {
      sensitiveActionsRequireConfirmation: true,
      hideSensitivePanels: false,
      readOnlyMode: false,
    },
  },
];

function createDefaultProfiles() {
  const now = new Date().toISOString();
  const profiles = DEFAULT_PROFILES_SPEC.map(spec => ({
    id: spec.id,
    name: spec.name,
    type: spec.type,
    enabled: spec.enabled,
    createdAt: now,
    updatedAt: now,
    preferences: spec.preferences,
    permissions: getDefaultPermissions(spec.type),
    safety: spec.safetyOverrides,
  }));
  profileStore.saveProfiles(profiles);
  try {
    const auditPath = getAuditPath();
    fs.mkdirSync(path.dirname(auditPath), { recursive: true });
    fs.writeFileSync(auditPath, JSON.stringify([], null, 2), 'utf8');
  } catch { /* ignore */ }
  return profiles;
}

function ensureDefaultProfiles() {
  const existing = profileStore.loadProfiles();
  if (existing.length === 0) {
    return createDefaultProfiles();
  }
  const hasMain = existing.some(p => p.id === 'main');
  if (!hasMain) {
    const now = new Date().toISOString();
    const spec = DEFAULT_PROFILES_SPEC[0];
    existing.unshift({
      id: spec.id,
      name: spec.name,
      type: spec.type,
      enabled: spec.enabled,
      createdAt: now,
      updatedAt: now,
      preferences: spec.preferences,
      permissions: getDefaultPermissions(spec.type),
      safety: spec.safetyOverrides,
    });
    profileStore.saveProfiles(existing);
  }
  return profileStore.loadProfiles();
}

function switchProfile(id) {
  const profile = profileStore.setActiveProfile(id);
  auditProfileEvent({ event: 'profile_switch', profileId: id, profileName: profile.name, profileType: profile.type });
  return profile;
}

function getEffectiveProfile() {
  return profileStore.getActiveProfile() || profileStore.getProfile('main');
}

function getProfileDashboardConfig(id) {
  const profile = profileStore.getProfile(id);
  if (!profile) return null;
  return {
    profileId: profile.id,
    profileType: profile.type,
    visibleSections: (profile.preferences || {}).visibleSections || [],
    tvModeDefault: !!(profile.preferences || {}).tvModeDefault,
    compactMode: !!(profile.preferences || {}).compactMode,
    readOnlyMode: !!(profile.safety || {}).readOnlyMode,
    hideSensitivePanels: !!(profile.safety || {}).hideSensitivePanels,
    refreshIntervalSeconds: (profile.preferences || {}).refreshIntervalSeconds || 30,
  };
}

function loadAudit() {
  try {
    const auditPath = getAuditPath();
    if (!fs.existsSync(auditPath)) return [];
    const raw = fs.readFileSync(auditPath, 'utf8');
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

function auditProfileEvent(eventData) {
  if (!isAuditEnabled()) return;
  try {
    const auditPath = getAuditPath();
    const entries = loadAudit();
    const entry = {
      at: new Date().toISOString(),
      event: String(eventData.event || 'unknown').slice(0, 40),
      profileId: eventData.profileId ? String(eventData.profileId).slice(0, 20) : undefined,
      profileName: eventData.profileName ? maskProfileSensitiveData(String(eventData.profileName).slice(0, 40)) : undefined,
      profileType: eventData.profileType || undefined,
    };
    entries.unshift(entry);
    const trimmed = entries.slice(0, MAX_AUDIT);
    fs.mkdirSync(path.dirname(auditPath), { recursive: true });
    fs.writeFileSync(auditPath, JSON.stringify(trimmed, null, 2), 'utf8');
  } catch { /* ignore */ }
}

function getAudit() {
  return loadAudit();
}

function clearAudit() {
  try {
    fs.writeFileSync(getAuditPath(), JSON.stringify([], null, 2), 'utf8');
  } catch { /* ignore */ }
  return { cleared: true };
}

module.exports = {
  createDefaultProfiles,
  ensureDefaultProfiles,
  switchProfile,
  getEffectiveProfile,
  getProfileDashboardConfig,
  auditProfileEvent,
  getAudit,
  clearAudit,
};

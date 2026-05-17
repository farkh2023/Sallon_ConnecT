'use strict';

const ALLOWED_TYPES = ['owner', 'family', 'guest', 'tv', 'diagnostic'];
const ALLOWED_THEMES = ['dark', 'light', 'system'];
const ALLOWED_ACCENT_COLORS = ['blue', 'green', 'orange', 'purple', 'red', 'slate'];
const ALLOWED_DEFAULT_VIEWS = ['dashboard', 'media', 'notifications', 'observability'];
const ALLOWED_SECTIONS = ['dashboard', 'devices', 'media', 'scenarios', 'notifications', 'scheduler', 'observability'];
const ALLOWED_LANGUAGES = ['fr', 'en'];

const SENSITIVE_PATTERNS = [
  /Bearer\s+\S+/gi,
  /token[=:]\s*\S{8,}/gi,
  /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
  /[A-Za-z]:[\\\/][^\s"',]{20,}/g,
  /\/(?:home|var|usr|etc|tmp)\/[^\s"',]{10,}/g,
];

function maskProfileSensitiveData(text) {
  if (typeof text !== 'string') return text;
  let out = text;
  for (const pattern of SENSITIVE_PATTERNS) {
    out = out.replace(pattern, '[masked]');
  }
  return out;
}

function sanitizeString(val, maxLen = 80) {
  if (typeof val !== 'string') return '';
  return maskProfileSensitiveData(val.trim().slice(0, maxLen));
}

function sanitizePreferences(prefs) {
  if (!prefs || typeof prefs !== 'object') return {};
  const out = {};
  if (ALLOWED_THEMES.includes(prefs.theme)) out.theme = prefs.theme;
  if (ALLOWED_ACCENT_COLORS.includes(prefs.accentColor)) out.accentColor = prefs.accentColor;
  if (ALLOWED_DEFAULT_VIEWS.includes(prefs.defaultView)) out.defaultView = prefs.defaultView;
  if (typeof prefs.tvModeDefault === 'boolean') out.tvModeDefault = prefs.tvModeDefault;
  if (typeof prefs.compactMode === 'boolean') out.compactMode = prefs.compactMode;
  if (ALLOWED_LANGUAGES.includes(prefs.language)) out.language = prefs.language;
  if (typeof prefs.refreshIntervalSeconds === 'number') {
    out.refreshIntervalSeconds = Math.min(Math.max(5, Math.floor(prefs.refreshIntervalSeconds)), 300);
  }
  if (Array.isArray(prefs.visibleSections)) {
    out.visibleSections = prefs.visibleSections.filter(s => ALLOWED_SECTIONS.includes(s));
  }
  return out;
}

function sanitizePermissions(perms) {
  if (!perms || typeof perms !== 'object') return {};
  const BOOL_KEYS = [
    'viewDevices', 'viewMedia', 'viewNotifications', 'viewScheduler', 'viewObservability',
    'runSafeDiagnostics', 'runSchedulerManual', 'manageProfiles',
    'executeSmartThingsScenes', 'executeTvCommands', 'startStreaming', 'clearAudits',
  ];
  const out = {};
  for (const key of BOOL_KEYS) {
    if (typeof perms[key] === 'boolean') out[key] = perms[key];
  }
  return out;
}

function sanitizeSafety(safety) {
  if (!safety || typeof safety !== 'object') return {};
  const out = {};
  if (typeof safety.sensitiveActionsRequireConfirmation === 'boolean') {
    out.sensitiveActionsRequireConfirmation = safety.sensitiveActionsRequireConfirmation;
  }
  if (typeof safety.hideSensitivePanels === 'boolean') out.hideSensitivePanels = safety.hideSensitivePanels;
  if (typeof safety.readOnlyMode === 'boolean') out.readOnlyMode = safety.readOnlyMode;
  return out;
}

function sanitizeProfile(input) {
  if (!input || typeof input !== 'object') return {};
  return {
    name: sanitizeString(input.name, 40),
    type: ALLOWED_TYPES.includes(input.type) ? input.type : 'guest',
    enabled: typeof input.enabled === 'boolean' ? input.enabled : true,
    preferences: sanitizePreferences(input.preferences),
    permissions: sanitizePermissions(input.permissions),
    safety: sanitizeSafety(input.safety),
  };
}

function sanitizeProfileForResponse(profile) {
  if (!profile || typeof profile !== 'object') return {};
  return {
    id: profile.id ? String(profile.id).slice(0, 16) : undefined,
    name: maskProfileSensitiveData(String(profile.name || '').slice(0, 40)),
    type: profile.type,
    enabled: profile.enabled,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    preferences: profile.preferences || {},
    permissions: profile.permissions || {},
    safety: profile.safety || {},
  };
}

function validateProfileInput(input) {
  const errors = [];
  if (!input || typeof input !== 'object') {
    errors.push('Input invalide.');
    return { valid: false, errors };
  }
  if (!input.name || typeof input.name !== 'string' || input.name.trim().length < 1) {
    errors.push('Le nom est requis.');
  }
  if (input.name && input.name.trim().length > 40) {
    errors.push('Le nom ne doit pas dépasser 40 caractères.');
  }
  if (input.type && !ALLOWED_TYPES.includes(input.type)) {
    errors.push(`Type invalide. Valeurs acceptées : ${ALLOWED_TYPES.join(', ')}.`);
  }
  return { valid: errors.length === 0, errors };
}

function validateProfilePreferences(preferences) {
  const errors = [];
  if (!preferences || typeof preferences !== 'object') return { valid: true, errors: [] };
  if (preferences.theme && !ALLOWED_THEMES.includes(preferences.theme)) {
    errors.push(`Thème invalide. Valeurs : ${ALLOWED_THEMES.join(', ')}.`);
  }
  if (preferences.language && !ALLOWED_LANGUAGES.includes(preferences.language)) {
    errors.push(`Langue invalide. Valeurs : ${ALLOWED_LANGUAGES.join(', ')}.`);
  }
  if (preferences.refreshIntervalSeconds !== undefined) {
    const v = Number(preferences.refreshIntervalSeconds);
    if (isNaN(v) || v < 5 || v > 300) errors.push('refreshIntervalSeconds doit être entre 5 et 300.');
  }
  return { valid: errors.length === 0, errors };
}

function buildSafeProfileError(error) {
  return {
    status: 'error',
    error: 'Opération profil échouée de manière sécurisée.',
    localOnly: true,
    secretsMasked: true,
    message: error && typeof error.message === 'string'
      ? maskProfileSensitiveData(error.message.slice(0, 100))
      : undefined,
  };
}

module.exports = {
  sanitizeProfile,
  sanitizeProfileForResponse,
  maskProfileSensitiveData,
  validateProfileInput,
  validateProfilePreferences,
  buildSafeProfileError,
  ALLOWED_TYPES,
  ALLOWED_SECTIONS,
};

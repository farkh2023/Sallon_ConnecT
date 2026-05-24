'use strict';

const WORKSPACE_THEMES    = new Set(['dark', 'light', 'system']);
const WORKSPACE_LANGUAGES = new Set(['fr', 'en']);
const MAX_NAME   = 60;
const MAX_DESC   = 300;
const MAX_COUNT  = () => parseInt(process.env.SALLON_WORKSPACE_MAX_COUNT || '20', 10);
const DEFAULT_ID = () => {
  const raw = process.env.SALLON_DEFAULT_WORKSPACE || 'default';
  return /^[a-zA-Z0-9_-]{1,40}$/.test(raw) ? raw : 'default';
};

const DEFAULT_SETTINGS = {
  theme:          'dark',
  language:       'fr',
  aiEnabled:      false,
  ragEnabled:     false,
  memoryEnabled:  false,
  kbEnabled:      false,
  workflowsEnabled: false,
  agentsEnabled:  false,
};

function validateProfile(p) {
  const errors = [];
  if (!p || typeof p !== 'object') return { valid: false, errors: ['profile_invalide'] };
  if (!p.id   || typeof p.id   !== 'string' || !/^[a-zA-Z0-9_-]{1,40}$/.test(p.id)) errors.push('id_invalide');
  if (!p.name || typeof p.name !== 'string' || p.name.trim().length === 0 || p.name.length > MAX_NAME) errors.push('name_requis_max_60');
  if (p.description && (typeof p.description !== 'string' || p.description.length > MAX_DESC)) errors.push('description_max_300');
  if (p.localOnly === false) errors.push('localOnly_requis');
  if (p.settings !== undefined) {
    const sv = validateSettings(p.settings);
    if (!sv.valid) errors.push(...sv.errors);
  }
  return { valid: errors.length === 0, errors };
}

function normalizeSettings(settings = {}) {
  const next = { ...DEFAULT_SETTINGS };
  if (WORKSPACE_THEMES.has(settings.theme)) next.theme = settings.theme;
  if (WORKSPACE_LANGUAGES.has(settings.language)) next.language = settings.language;
  for (const key of ['aiEnabled', 'ragEnabled', 'memoryEnabled', 'kbEnabled', 'workflowsEnabled', 'agentsEnabled']) {
    if (typeof settings[key] === 'boolean') next[key] = settings[key];
  }
  return next;
}

function validateSettings(settings) {
  const errors = [];
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) return { valid: false, errors: ['settings_invalide'] };
  if (settings.theme !== undefined && !WORKSPACE_THEMES.has(settings.theme)) errors.push('theme_invalide');
  if (settings.language !== undefined && !WORKSPACE_LANGUAGES.has(settings.language)) errors.push('language_invalide');
  for (const key of ['aiEnabled', 'ragEnabled', 'memoryEnabled', 'kbEnabled', 'workflowsEnabled', 'agentsEnabled']) {
    if (settings[key] !== undefined && typeof settings[key] !== 'boolean') errors.push(`${key}_booleen_requis`);
  }
  return { valid: errors.length === 0, errors };
}

module.exports = {
  WORKSPACE_THEMES, WORKSPACE_LANGUAGES,
  MAX_NAME, MAX_DESC, MAX_COUNT, DEFAULT_ID, DEFAULT_SETTINGS,
  normalizeSettings, validateSettings, validateProfile,
};

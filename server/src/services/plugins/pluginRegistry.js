'use strict';

const fs   = require('fs');
const path = require('path');
const { sanitizePluginId, validateManifest } = require('./pluginSafety');

const PLUGINS_DIR = path.join(__dirname, '../../../../plugins');
const STATE_FILE  = path.join(__dirname, '../../../../runtime/plugins-state.json');

function readState() {
  try {
    if (!fs.existsSync(STATE_FILE)) return { enabled: [], disabled: [] };
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return { enabled: [], disabled: [] };
  }
}

function writeState(state) {
  try {
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch {
    // ecriture etat non bloquante
  }
}

function discoverPlugins() {
  const plugins = [];
  try {
    if (!fs.existsSync(PLUGINS_DIR)) return plugins;
    const entries = fs.readdirSync(PLUGINS_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const manifestPath = path.join(PLUGINS_DIR, entry.name, 'plugin.json');
      try {
        if (!fs.existsSync(manifestPath)) continue;
        const raw      = fs.readFileSync(manifestPath, 'utf8');
        const manifest = JSON.parse(raw);
        const check    = validateManifest(manifest);
        plugins.push({ manifest, valid: check.ok, error: check.error });
      } catch {
        plugins.push({
          manifest: { id: entry.name, name: entry.name, version: '0.0.0', permissions: [], localOnly: false },
          valid: false,
          error: 'manifest illisible ou JSON invalide',
        });
      }
    }
  } catch {
    // dossier plugins inaccessible — retourner liste vide
  }
  return plugins;
}

function listPlugins() {
  const state      = readState();
  const discovered = discoverPlugins();

  return discovered.map(({ manifest, valid, error }) => ({
    id:          manifest.id || 'unknown',
    name:        manifest.name || manifest.id || 'Inconnu',
    version:     manifest.version || '0.0.0',
    description: typeof manifest.description === 'string' ? manifest.description : '',
    author:      typeof manifest.author === 'string' ? manifest.author : 'local',
    permissions: Array.isArray(manifest.permissions) ? manifest.permissions : [],
    localOnly:   manifest.localOnly === true,
    enabled:     valid && Array.isArray(state.enabled) && state.enabled.includes(manifest.id),
    valid,
    error:       valid ? null : (error || 'invalide'),
  }));
}

function enablePlugin(id) {
  const safe = sanitizePluginId(id);
  if (!safe) return { ok: false, error: 'id invalide' };

  const discovered = discoverPlugins();
  const found      = discovered.find(p => p.manifest.id === safe);
  if (!found)       return { ok: false, error: 'plugin introuvable' };
  if (!found.valid) return { ok: false, error: found.error || 'plugin invalide' };

  const state = readState();
  if (!Array.isArray(state.enabled))  state.enabled  = [];
  if (!Array.isArray(state.disabled)) state.disabled = [];
  if (!state.enabled.includes(safe))  state.enabled.push(safe);
  state.disabled = state.disabled.filter(d => d !== safe);
  writeState(state);
  return { ok: true };
}

function disablePlugin(id) {
  const safe = sanitizePluginId(id);
  if (!safe) return { ok: false, error: 'id invalide' };

  const state = readState();
  if (!Array.isArray(state.enabled))  state.enabled  = [];
  if (!Array.isArray(state.disabled)) state.disabled = [];
  state.enabled  = state.enabled.filter(e => e !== safe);
  if (!state.disabled.includes(safe)) state.disabled.push(safe);
  writeState(state);
  return { ok: true };
}

module.exports = { listPlugins, enablePlugin, disablePlugin };

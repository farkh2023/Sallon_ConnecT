'use strict';

const fs    = require('fs');
const path  = require('path');
const store = require('./workspaceStore');
const { DEFAULT_ID, DEFAULT_SETTINGS } = require('./workspaceTypes');
const { safeJoin } = require('./workspaceContext');

const LEGACY_DIRS = {
  memory:    ['ai-memory'],
  rag:       ['rag'],
  knowledge: ['knowledge'],
  agents:    ['agents'],
  workflows: ['workflows'],
};

function legacyRoot() {
  return path.resolve(process.cwd(), 'runtime');
}

function exists(dir) {
  try { return fs.existsSync(dir); } catch { return false; }
}

function getLegacyMigrationReport() {
  const root = legacyRoot();
  const defaultDir = store.getWorkspaceDir(DEFAULT_ID());
  const entries = Object.entries(LEGACY_DIRS).map(([domain, parts]) => {
    const source = safeJoin(root, ...parts);
    const target = safeJoin(defaultDir, domain === 'memory' ? 'memory' : domain);
    return {
      domain,
      legacyDetected: exists(source),
      targetPrepared: exists(target),
      destructive: false,
      action: process.env.SALLON_WORKSPACE_LEGACY_FALLBACK !== 'false' ? 'legacy_fallback' : 'copy_available',
    };
  });
  return {
    ok: true,
    workspaceId: DEFAULT_ID(),
    autoMigration: process.env.SALLON_WORKSPACE_MIGRATION_AUTO === 'true',
    destructive: false,
    entries,
    legacyDetected: entries.some(e => e.legacyDetected),
  };
}

// Ensure existing data (memory, rag, etc.) is associated with the default workspace.
// This is a no-op migration that creates the directory structure without moving data.
function migrateToDefault(options = {}) {
  const defId  = DEFAULT_ID();
  const defDir = store.getWorkspaceDir(defId);
  if (!fs.existsSync(defDir)) {
    store.init();
    return { ok: true, action: 'created_default', id: defId, report: getLegacyMigrationReport() };
  }
  const settF = path.join(defDir, 'settings.json');
  if (!fs.existsSync(settF)) {
    fs.writeFileSync(settF, JSON.stringify({ ...DEFAULT_SETTINGS }, null, 2), 'utf8');
    return { ok: true, action: 'restored_settings', id: defId, report: getLegacyMigrationReport() };
  }
  const report = getLegacyMigrationReport();
  if (options.copyLegacy === true) {
    // Non destructive: copie uniquement les fichiers manquants dans runtime/workspaces/default.
    for (const entry of report.entries) {
      if (!entry.legacyDetected) continue;
      const source = safeJoin(legacyRoot(), ...LEGACY_DIRS[entry.domain]);
      const target = safeJoin(defDir, entry.domain === 'memory' ? 'memory' : entry.domain);
      copyMissing(source, target);
    }
    return { ok: true, action: 'copied_legacy_missing_files', id: defId, report: getLegacyMigrationReport() };
  }
  return { ok: true, action: 'already_migrated', id: defId, report };
}

function copyMissing(source, target) {
  if (!exists(source)) return;
  if (!exists(target)) fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const src = safeJoin(source, entry.name);
    const dst = safeJoin(target, entry.name);
    if (entry.isDirectory()) copyMissing(src, dst);
    else if (entry.isFile() && !exists(dst)) fs.copyFileSync(src, dst);
  }
}

function getSchemaVersion() {
  return '1.0';
}

module.exports = { migrateToDefault, getSchemaVersion, getLegacyMigrationReport };

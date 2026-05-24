'use strict';

const express = require('express');
const router  = express.Router();

const store   = require('../workspaces/workspaceStore');
const migration = require('../workspaces/workspaceMigration');
const { exportWorkspace, importWorkspace } = require('../workspaces/workspaceExport');
const { getWorkspaceSafety, validateWorkspaceId } = require('../workspaces/workspaceSafety');
const bus = require('../services/serverEventBus');

const ENABLED = () => process.env.SALLON_WORKSPACES_ENABLED !== 'false';

function generateId() {
  return `ws_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function emit(bus, event, data) {
  try {
    if (bus && bus.publish) bus.publish({ type: event, severity: 'info', source: 'backend', message: event, details: JSON.stringify(data || {}) });
    else if (bus && bus.emit) bus.emit(event, data);
  } catch {}
}

let _bus = bus;
function setBus(bus) { _bus = bus; }

router.use((req, res, next) => {
  let raw = req.url || '';
  try { raw = decodeURIComponent(raw); } catch { return res.status(400).json({ ok: false, error: 'url_invalide' }); }
  if (raw.includes('..') || raw.includes('\\')) return res.status(400).json({ ok: false, error: 'path_traversal_bloque' });
  next();
});

// GET /api/workspaces/status
router.get('/status', (_req, res) => {
  const migrationResult = migration.migrateToDefault({
    copyLegacy: process.env.SALLON_WORKSPACE_MIGRATION_AUTO === 'true',
  });
  emit(_bus, 'workspace.migration.completed', { action: migrationResult.action, id: migrationResult.id });
  res.json({
    ok:       true,
    enabled:  ENABLED(),
    current:  store.getCurrentId(),
    total:    store.listProfiles().length,
    safety:   getWorkspaceSafety(),
    migration: migrationResult.report,
  });
});

// GET /api/workspaces/current
router.get('/current', (_req, res) => {
  store.init();
  const id      = store.getCurrentId();
  const profile = store.getProfile(id);
  res.json({ ok: true, current: profile || null, id });
});

// GET /api/workspaces
router.get('/', (_req, res) => {
  store.init();
  const profiles = store.listProfiles();
  const current  = store.getCurrentId();
  res.json({ ok: true, profiles, total: profiles.length, current });
});

// POST /api/workspaces/switch  (before /:id)
router.post('/switch', (req, res) => {
  const { id } = req.body || {};
  if (!id || !validateWorkspaceId(id)) return res.status(400).json({ ok: false, error: 'id_invalide' });
  const profile = store.getProfile(id);
  if (!profile) return res.status(404).json({ ok: false, error: 'workspace_introuvable' });
  store.setCurrentId(id);
  try { require('../search/globalSearchIndexer').invalidateIndex(); } catch {}
  emit(_bus, 'workspace.switched', { id });
  res.json({ ok: true, current: profile });
});

// POST /api/workspaces/import  (before /:id)
router.post('/import', (req, res) => {
  if (!ENABLED()) return res.status(503).json({ ok: false, error: 'workspaces_desactive' });
  try {
    const profile = importWorkspace(req.body);
    emit(_bus, 'workspace.imported', { id: profile.id });
    res.status(201).json({ ok: true, profile });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

// GET /api/workspaces/:id
router.get('/:id', (req, res) => {
  const { id } = req.params;
  if (!validateWorkspaceId(id)) return res.status(400).json({ ok: false, error: 'id_invalide' });
  const profile = store.getProfile(id);
  if (!profile) return res.status(404).json({ ok: false, error: 'workspace_introuvable' });
  res.json({ ok: true, profile });
});

// POST /api/workspaces
router.post('/', (req, res) => {
  if (!ENABLED()) return res.status(503).json({ ok: false, error: 'workspaces_desactive' });
  try {
    const id      = req.body?.id || generateId();
    const profile = store.createProfile({ ...req.body, id });
    emit(_bus, 'workspace.created', { id: profile.id });
    res.status(201).json({ ok: true, profile });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

// PUT /api/workspaces/:id
router.put('/:id', (req, res) => {
  if (!ENABLED()) return res.status(503).json({ ok: false, error: 'workspaces_desactive' });
  const { id } = req.params;
  if (!validateWorkspaceId(id)) return res.status(400).json({ ok: false, error: 'id_invalide' });
  try {
    const updated = store.updateProfile(id, req.body);
    if (!updated) return res.status(404).json({ ok: false, error: 'workspace_introuvable' });
    emit(_bus, 'workspace.updated', { id });
    res.json({ ok: true, profile: updated });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

// DELETE /api/workspaces/:id
router.delete('/:id', (req, res) => {
  const { id }          = req.params;
  const { confirmation } = req.body || {};
  if (!validateWorkspaceId(id)) return res.status(400).json({ ok: false, error: 'id_invalide' });
  const result = store.deleteProfile(id, { confirmation });
  if (!result.ok) {
    emit(_bus, 'workspace.delete.rejected', { id, reason: result.error });
    return res.status(400).json(result);
  }
  emit(_bus, 'workspace.deleted', { id });
  res.json({ ok: true });
});

// POST /api/workspaces/:id/export
router.post('/:id/export', (req, res) => {
  const { id } = req.params;
  if (!validateWorkspaceId(id)) return res.status(400).json({ ok: false, error: 'id_invalide' });
  try {
    const result = exportWorkspace(id);
    emit(_bus, 'workspace.exported', { id, checksum: result.checksum });
    res.json(result);
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

module.exports = router;
module.exports.setBus = setBus;

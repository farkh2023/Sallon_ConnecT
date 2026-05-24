'use strict';

const express  = require('express');
const router   = express.Router();

const retriever = require('../search/globalSearchRetriever');
const registry  = require('../search/commandRegistry');
const center    = require('../search/commandCenter');
const indexer   = require('../search/globalSearchIndexer');
const { getSearchSafety, validateCommandId } = require('../search/globalSearchSafety');
const { validateSearchQuery, TOP_K }         = require('../search/globalSearchTypes');
const { getWorkspaceOptions }                = require('../workspaces/workspaceContext');

const ENABLED = () => process.env.SALLON_SEARCH_ENABLED !== 'false';

function emit(bus, event, data) {
  try { if (bus && bus.emit) bus.emit(event, data); } catch {}
}

let _bus = null;
function setBus(bus) { _bus = bus; }

function workspaceScope(req, res) {
  try {
    return getWorkspaceOptions(req);
  } catch (err) {
    res.status(err.message === 'workspace_introuvable' ? 404 : 400)
      .json({ ok: false, error: err.message || 'workspace_invalide' });
    return null;
  }
}

function opt(scope) {
  return scope.explicit ? scope.options : undefined;
}

// GET /api/search/status
router.get('/status', (req, res) => {
  const scope = workspaceScope(req, res);
  if (!scope) return;
  res.json({
    ok:      true,
    workspaceId: scope.context.workspaceId,
    enabled: ENABLED(),
    safety:  getSearchSafety(),
    commands: registry.getAllCommands().length,
    indexed:  opt(scope) ? indexer.getIndex(opt(scope)).length : indexer.getIndex().length,
  });
});

// GET /api/search/commands
router.get('/commands', (req, res) => {
  const scope = workspaceScope(req, res);
  if (!scope) return;
  const { q } = req.query;
  const cmds  = q ? registry.searchCommands(q) : registry.getAllCommands();
  res.json({ ok: true, workspaceId: scope.context.workspaceId, commands: cmds, total: cmds.length });
});

// POST /api/search
router.post('/', async (req, res) => {
  const { query, filters = {}, topK, suggest = false } = req.body || {};
  const scope = workspaceScope(req, res);
  if (!scope) return;
  const v = validateSearchQuery(query);
  if (!v.valid) return res.status(400).json({ ok: false, errors: v.errors });

  try {
    emit(_bus, 'search.started', { query });
    const result = opt(scope)
      ? retriever.search(query, filters, topK || TOP_K(), opt(scope))
      : retriever.search(query, filters, topK || TOP_K());

    let suggestion = null;
    if (suggest) {
      suggestion = await retriever.suggestQuery(query);
    }

    emit(_bus, 'search.completed', { query, total: result.total });
    res.json({ ok: true, workspaceId: scope.context.workspaceId, ...result, query, suggestion });
  } catch (e) {
    emit(_bus, 'search.failed', { query, error: e.message });
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/search/commands/:id/preview
router.post('/commands/:id/preview', (req, res) => {
  const { id } = req.params;
  if (!validateCommandId(id)) return res.status(400).json({ ok: false, error: 'id_invalide' });
  const preview = center.previewCommand(id);
  if (!preview) return res.status(404).json({ ok: false, error: 'commande_introuvable' });
  emit(_bus, 'command.previewed', { id });
  res.json({ ok: true, preview });
});

// POST /api/search/commands/:id/run
router.post('/commands/:id/run', (req, res) => {
  const { id } = req.params;
  if (!validateCommandId(id)) return res.status(400).json({ ok: false, error: 'id_invalide' });
  const params = req.body || {};
  const result = center.runCommand(id, params);
  if (!result.ok) {
    emit(_bus, 'command.rejected', { id, reason: result.error });
    return res.status(400).json(result);
  }
  emit(_bus, 'command.executed.safe', { id, action: result.action });
  res.json(result);
});

module.exports = router;
module.exports.setBus = setBus;

'use strict';

const express  = require('express');
const router   = express.Router();

const store     = require('../ai/knowledge/knowledgeStore');
const indexer   = require('../ai/knowledge/knowledgeIndexer');
const retriever = require('../ai/knowledge/knowledgeRetriever');
const graph     = require('../ai/knowledge/knowledgeGraph');
const summaries = require('../ai/knowledge/knowledgeSummaries');
const { getKnowledgeSafety, validateId } = require('../ai/knowledge/knowledgeSafety');
const { DEFAULT_TOPK }                   = require('../ai/knowledge/knowledgeTypes');
const { getWorkspaceOptions }            = require('../workspaces/workspaceContext');

const ENABLED = () => process.env.SALLON_KNOWLEDGE_ENABLED === 'true';

function generateId() {
  return `kb_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function emit(bus, event, data) {
  try { if (bus && bus.emit) bus.emit(event, data); } catch {}
}

let _bus = null;
function setBus(bus) { _bus = bus; }

function publish(type, severity, message) {
  try { require('../services/serverEventBus').publish({ type, severity, source: 'backend', message }); } catch {}
}

function workspaceScope(req, res) {
  try {
    return getWorkspaceOptions(req);
  } catch (err) {
    publish('workspace.isolation.violation.blocked', 'warning', err.message || 'workspace_invalide');
    res.status(err.message === 'workspace_introuvable' ? 404 : 400)
      .json({ ok: false, error: err.message || 'workspace_invalide' });
    return null;
  }
}

function opt(scope) {
  return scope.explicit ? scope.options : undefined;
}

// GET /api/ai/knowledge/status
router.get('/status', (req, res) => {
  const scope = workspaceScope(req, res);
  if (!scope) return;
  const meta = opt(scope) ? store.getMeta(opt(scope)) : store.getMeta();
  res.json({
    ok:      true,
    workspaceId: scope.context.workspaceId,
    enabled: ENABLED(),
    safety:  getKnowledgeSafety(),
    meta,
  });
});

// GET /api/ai/knowledge
router.get('/', (req, res) => {
  const scope = workspaceScope(req, res);
  if (!scope) return;
  const { type, source, tag, entity } = req.query;
  const filters = { type, source, tag, entity };
  const items = opt(scope) ? store.listItems(filters, opt(scope)) : store.listItems(filters);
  const meta  = opt(scope) ? store.getMeta(opt(scope)) : store.getMeta();
  res.json({ ok: true, workspaceId: scope.context.workspaceId, items, total: items.length, meta, safety: getKnowledgeSafety() });
});

// POST /api/ai/knowledge/search
router.post('/search', async (req, res) => {
  try {
    const scope = workspaceScope(req, res);
    if (!scope) return;
    const { query, filters = {}, topK } = req.body || {};
    if (!query || typeof query !== 'string') return res.status(400).json({ ok: false, error: 'query_requise' });
    const k       = topK || DEFAULT_TOPK();
    const results = opt(scope)
      ? await retriever.searchWithEmbeddings(query, filters, k, opt(scope))
      : await retriever.searchWithEmbeddings(query, filters, k);
    emit(_bus, 'knowledge.search.completed', { query, total: results.length });
    res.json({ ok: true, workspaceId: scope.context.workspaceId, results, total: results.length, query });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/ai/knowledge/graph
router.post('/graph', (req, res) => {
  try {
    const scope = workspaceScope(req, res);
    if (!scope) return;
    const filters = req.body?.filters || {};
    const g = opt(scope) ? graph.buildGraph(filters, opt(scope)) : graph.buildGraph(filters);
    emit(_bus, 'knowledge.graph.generated', { nodes: g.totalNodes, edges: g.totalEdges });
    res.json({ ok: true, workspaceId: scope.context.workspaceId, ...g });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/ai/knowledge/summarize
router.post('/summarize', async (req, res) => {
  try {
    const scope = workspaceScope(req, res);
    if (!scope) return;
    const { category } = req.body || {};
    if (category) {
      const result = opt(scope) ? await summaries.summarizeCategory(category, opt(scope)) : await summaries.summarizeCategory(category);
      emit(_bus, 'knowledge.summary.generated', { category });
      return res.json({ ok: true, workspaceId: scope.context.workspaceId, ...result });
    }
    const result = opt(scope) ? await summaries.summarizeAll(opt(scope)) : await summaries.summarizeAll();
    emit(_bus, 'knowledge.summary.generated', { category: 'all' });
    res.json({ ok: true, workspaceId: scope.context.workspaceId, summaries: result });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/ai/knowledge/reindex
router.post('/reindex', (req, res) => {
  const scope = workspaceScope(req, res);
  if (!scope) return;
  if (!ENABLED()) return res.status(503).json({ ok: false, error: 'knowledge_desactive' });
  try {
    emit(_bus, 'knowledge.index.started', {});
    const idx = opt(scope) ? indexer.rebuildIndex(opt(scope)) : indexer.rebuildIndex();
    emit(_bus, 'knowledge.index.completed', { total: idx.size });
    publish('workspace.knowledge.indexed', 'success', `Knowledge workspace ${scope.context.workspaceId} indexee`);
    res.json({ ok: true, workspaceId: scope.context.workspaceId, indexed: idx.size });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/ai/knowledge/clear
router.post('/clear', (req, res) => {
  const { confirmation } = req.body || {};
  const scope = workspaceScope(req, res);
  if (!scope) return;
  if (confirmation !== 'EFFACER_KNOWLEDGE_BASE') {
    return res.status(400).json({ ok: false, error: 'confirmation_requise: EFFACER_KNOWLEDGE_BASE' });
  }
  try {
    if (opt(scope)) {
      store.clearItems(opt(scope));
      indexer.invalidateIndex(opt(scope));
    } else {
      store.clearItems();
      indexer.invalidateIndex();
    }
    emit(_bus, 'knowledge.clear.completed', {});
    res.json({ ok: true, workspaceId: scope.context.workspaceId, message: 'base_de_connaissances_effacee' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// GET /api/ai/knowledge/:id
router.get('/:id', (req, res) => {
  const scope = workspaceScope(req, res);
  if (!scope) return;
  const { id } = req.params;
  if (!validateId(id)) return res.status(400).json({ ok: false, error: 'id_invalide' });
  const item = opt(scope) ? store.getItem(id, opt(scope)) : store.getItem(id);
  if (!item) return res.status(404).json({ ok: false, error: 'item_introuvable' });
  res.json({ ok: true, workspaceId: scope.context.workspaceId, item });
});

// POST /api/ai/knowledge (create)
router.post('/', (req, res) => {
  const scope = workspaceScope(req, res);
  if (!scope) return;
  if (!ENABLED()) return res.status(503).json({ ok: false, error: 'knowledge_desactive' });
  try {
    const id   = generateId();
    const now  = new Date().toISOString();
    const item = { ...req.body, id, createdAt: req.body.createdAt || now, updatedAt: now, localOnly: true };
    const created = opt(scope) ? store.createItem(item, opt(scope)) : store.createItem(item);
    const enriched = indexer.enrichWithEntities(created);
    if (opt(scope)) indexer.indexItem(enriched, opt(scope));
    else indexer.indexItem(enriched);
    res.status(201).json({ ok: true, workspaceId: scope.context.workspaceId, item: enriched });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

// PATCH /api/ai/knowledge/:id
router.patch('/:id', (req, res) => {
  const scope = workspaceScope(req, res);
  if (!scope) return;
  if (!ENABLED()) return res.status(503).json({ ok: false, error: 'knowledge_desactive' });
  const { id } = req.params;
  if (!validateId(id)) return res.status(400).json({ ok: false, error: 'id_invalide' });
  try {
    const updated = opt(scope) ? store.updateItem(id, req.body, opt(scope)) : store.updateItem(id, req.body);
    if (!updated) return res.status(404).json({ ok: false, error: 'item_introuvable' });
    if (opt(scope)) indexer.indexItem(updated, opt(scope));
    else indexer.indexItem(updated);
    res.json({ ok: true, workspaceId: scope.context.workspaceId, item: updated });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

// DELETE /api/ai/knowledge/:id
router.delete('/:id', (req, res) => {
  const scope = workspaceScope(req, res);
  if (!scope) return;
  if (!ENABLED()) return res.status(503).json({ ok: false, error: 'knowledge_desactive' });
  const { id } = req.params;
  if (!validateId(id)) return res.status(400).json({ ok: false, error: 'id_invalide' });
  const existed = opt(scope) ? store.deleteItem(id, opt(scope)) : store.deleteItem(id);
  if (!existed) return res.status(404).json({ ok: false, error: 'item_introuvable' });
  if (opt(scope)) indexer.invalidateIndex(opt(scope));
  else indexer.invalidateIndex();
  res.json({ ok: true, workspaceId: scope.context.workspaceId });
});

module.exports = router;
module.exports.setBus = setBus;

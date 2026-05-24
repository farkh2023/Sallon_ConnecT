'use strict';

const express = require('express');
const router  = express.Router();

const {
  listItems, getItem, createItem, updateItem,
  deleteItem, clearItems, getMeta,
} = require('../ai/memory/memoryStore');

const { validateMemoryItem }             = require('../ai/memory/memoryTypes');
const { sanitizeMemoryItem, sanitizeForExport,
        getMemorySafety, maskSecretPatterns } = require('../ai/memory/memorySafety');
const { searchLexical, searchWithEmbeddings } = require('../ai/memory/memoryRetriever');
const { summarizeItems }                 = require('../ai/memory/memorySummarizer');
const { purgeExpired, purgeByAge, purgeByType,
        enforceMaxItems, getRetentionStatus } = require('../ai/memory/memoryRetention');
const { exportAll, importItems }         = require('../ai/memory/memoryExport');
const bus                                = require('../services/serverEventBus');

const MEM_ENABLED = () => process.env.SALLON_AI_MEMORY_ENABLED === 'true';

function pub(type, severity, message) {
  try { bus.publish({ type, severity, source: 'ai-memory', message }); } catch { /* non bloquant */ }
}

function memDisabledResponse(res) {
  return res.status(503).json({
    ok: false, error: 'memory_disabled',
    message: 'Mettre SALLON_AI_MEMORY_ENABLED=true dans .env.',
    safety: getMemorySafety(),
  });
}

function validId(id) {
  return typeof id === 'string' && /^[a-zA-Z0-9_-]+$/.test(id);
}

function generateId() {
  return `mem_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/* ── GET /api/ai/memory/status ── AVANT /:id ─────────────────────────────── */
router.get('/status', (_req, res) => {
  res.json({
    ok:        true,
    enabled:   MEM_ENABLED(),
    safety:    getMemorySafety(),
    retention: getRetentionStatus(),
  });
});

/* ── POST /api/ai/memory/search ── AVANT /:id ───────────────────────────── */
router.post('/search', async (req, res) => {
  const { query = '', filters = {}, topK = 10, useEmbeddings = false } = req.body || {};

  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ ok: false, error: 'query_requise' });
  }

  const safeTopK  = Math.min(Math.max(1, parseInt(String(topK), 10) || 10), 50);
  const safeQuery = maskSecretPatterns(query.trim());

  const results = useEmbeddings
    ? await searchWithEmbeddings(safeQuery, filters, safeTopK)
    : searchLexical(safeQuery, filters, safeTopK);

  pub('memory.search.completed', 'info', `Recherche memoire: "${safeQuery.slice(0, 40)}" — ${results.length} resultats`);
  res.json({ ok: true, results, total: results.length, query: safeQuery });
});

/* ── POST /api/ai/memory/summarize ── AVANT /:id ───────────────────────────*/
router.post('/summarize', async (req, res) => {
  const { ids = [], useAi = true } = req.body || {};

  const items = Array.isArray(ids) && ids.length > 0
    ? ids.filter(validId).map(id => getItem(id)).filter(Boolean)
    : listItems({});

  if (items.length === 0) {
    return res.json({ ok: true, summary: '', method: 'empty', items: 0 });
  }

  const result = await summarizeItems(items, { useAi });
  pub('memory.summary.created', 'info', `Resume memoire: ${items.length} items, methode: ${result.method}`);
  res.json({ ok: true, ...result, items: items.length });
});

/* ── POST /api/ai/memory/export ── AVANT /:id ───────────────────────────── */
router.post('/export', (_req, res) => {
  const { label = '' } = _req.body || {};
  const result = exportAll(String(label).slice(0, 100));
  pub('memory.export.completed', 'info', `Export memoire: ${result.totalItems} items`);
  res.json({ ok: true, ...result });
});

/* ── POST /api/ai/memory/import ── AVANT /:id ───────────────────────────── */
router.post('/import', (req, res) => {
  if (!MEM_ENABLED()) return memDisabledResponse(res);

  const payload = req.body;
  if (!payload || !Array.isArray(payload.items)) {
    return res.status(400).json({
      ok: false, error: 'format_invalide',
      message: 'Envoyer { "items": [...] }',
    });
  }

  const result = importItems(payload);
  pub('memory.import.completed', 'info', `Import memoire: ${result.imported} items importes`);
  res.status(result.ok ? 200 : 400).json({ ok: result.ok, ...result });
});

/* ── POST /api/ai/memory/clear ── AVANT /:id ────────────────────────────── */
router.post('/clear', (req, res) => {
  const { confirmation } = req.body || {};
  if (confirmation !== 'EFFACER_MEMOIRE') {
    return res.status(400).json({
      ok: false, error: 'confirmation_requise',
      message: 'Envoyer { "confirmation": "EFFACER_MEMOIRE" } pour confirmer.',
    });
  }

  const result = clearItems();
  pub('memory.clear.completed', 'warning', `Memoire effacee: ${result.cleared} items supprimes`);
  res.json({ ok: true, cleared: result.cleared });
});

/* ── GET /api/ai/memory ──────────────────────────────────────────────────── */
router.get('/', (req, res) => {
  const { type, scope, source, tags } = req.query;
  const filters = {};
  if (type)   filters.type   = type;
  if (scope)  filters.scope  = scope;
  if (source) filters.source = source;
  if (tags)   filters.tags   = String(tags).split(',').map(t => t.trim()).filter(Boolean);

  const items = listItems(filters);
  res.json({ items, total: items.length, meta: getMeta(), safety: getMemorySafety() });
});

/* ── POST /api/ai/memory ─────────────────────────────────────────────────── */
router.post('/', (req, res) => {
  if (!MEM_ENABLED()) return memDisabledResponse(res);

  const sanitized = sanitizeMemoryItem(req.body);
  if (!sanitized) return res.status(400).json({ ok: false, error: 'body_invalide' });

  sanitized.id             = sanitized.id || generateId();
  sanitized.localOnly      = true;
  sanitized.importance     = sanitized.importance ?? 1;
  sanitized.tags           = sanitized.tags || [];
  sanitized.embeddingHash  = null;
  sanitized.createdAt      = new Date().toISOString();
  sanitized.updatedAt      = new Date().toISOString();
  sanitized.lastAccessedAt = new Date().toISOString();

  const check = validateMemoryItem(sanitized);
  if (!check.valid) return res.status(400).json({ ok: false, errors: check.errors });

  const result = createItem(sanitized);
  if (!result.ok) return res.status(409).json({ ok: false, error: result.error });

  pub('memory.item.created', 'info', `Item memoire "${sanitized.id}" cree (${sanitized.type})`);
  res.status(201).json({ ok: true, id: sanitized.id });
});

/* ── GET /api/ai/memory/:id ─────────────────────────────────────────────── */
router.get('/:id', (req, res) => {
  const { id } = req.params;
  if (!validId(id)) return res.status(400).json({ ok: false, error: 'id_invalide' });
  const item = getItem(id);
  if (!item) return res.status(404).json({ ok: false, error: 'item_introuvable' });
  res.json(item);
});

/* ── PUT /api/ai/memory/:id ─────────────────────────────────────────────── */
router.put('/:id', (req, res) => {
  if (!MEM_ENABLED()) return memDisabledResponse(res);

  const { id } = req.params;
  if (!validId(id)) return res.status(400).json({ ok: false, error: 'id_invalide' });

  const sanitized = sanitizeMemoryItem(req.body);
  if (!sanitized) return res.status(400).json({ ok: false, error: 'body_invalide' });

  const merged = { ...sanitized, id, localOnly: true };
  const check  = validateMemoryItem(merged);
  if (!check.valid) return res.status(400).json({ ok: false, errors: check.errors });

  const result = updateItem(id, merged);
  if (!result.ok) return res.status(404).json({ ok: false, error: result.error });

  pub('memory.item.updated', 'info', `Item memoire "${id}" mis a jour`);
  res.json({ ok: true, id });
});

/* ── DELETE /api/ai/memory/:id ──────────────────────────────────────────── */
router.delete('/:id', (req, res) => {
  if (!MEM_ENABLED()) return memDisabledResponse(res);

  const { id } = req.params;
  if (!validId(id)) return res.status(400).json({ ok: false, error: 'id_invalide' });

  const deleted = deleteItem(id);
  if (!deleted) return res.status(404).json({ ok: false, error: 'item_introuvable' });

  pub('memory.item.deleted', 'warning', `Item memoire "${id}" supprime`);
  res.json({ ok: true, deleted: true });
});

module.exports = router;

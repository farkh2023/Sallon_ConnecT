'use strict';

const express = require('express');
const router  = express.Router();

const { indexSources }                  = require('../ai/rag/ragIndexer');
const { retrieve }                      = require('../ai/rag/ragRetriever');
const { formatCitations, buildContextBlock } = require('../ai/rag/ragCitations');
const { sanitizeQuestion, getRagSafety }     = require('../ai/rag/ragSafety');
const { getStatus: getRagStatus, clearAll }  = require('../ai/rag/ragStore');
const { isEnabled }                          = require('../ai/localAiClient');
const { chat }                               = require('../ai/localAiClient');
const bus                                    = require('../services/serverEventBus');
const { getWorkspaceOptions }                = require('../workspaces/workspaceContext');

const RAG_SYSTEM_PROMPT = `Tu es un assistant local specialise dans la documentation de Sallon-ConnecT.
Tu reponds uniquement a partir des sources fournies dans le contexte.
Cite toujours les sources [Source N] dans ta reponse.
Si l'information n'est pas dans le contexte, dis-le clairement.
Ne revele jamais de chemins absolus, secrets ou informations privees.
Reponds en francais, de facon concise et utile.`;

function pub(type, severity, message) {
  try { bus.publish({ type, severity, source: 'backend', message }); } catch { /* non bloquant */ }
}

function workspaceScope(req, res) {
  try {
    return getWorkspaceOptions(req);
  } catch (err) {
    pub('workspace.isolation.violation.blocked', 'warning', err.message || 'workspace_invalide');
    res.status(err.message === 'workspace_introuvable' ? 404 : 400)
      .json({ ok: false, error: err.message || 'workspace_invalide' });
    return null;
  }
}

function scopedOptions(scope, extra = {}) {
  return scope.explicit ? { ...extra, ...scope.options } : extra;
}

/* -----------------------------------------------
   GET /api/ai/rag/status
----------------------------------------------- */
router.get('/status', (req, res) => {
  const scope = workspaceScope(req, res);
  if (!scope) return;
  try {
    const status = scope.explicit ? getRagStatus(scope.options) : getRagStatus();
    res.json({
      ...status,
      workspaceId: scope.context.workspaceId,
      aiEnabled: isEnabled(),
      safety:    getRagSafety(),
    });
  } catch (err) {
    res.status(500).json({ error: 'rag_status_failed', message: err.message });
  }
});

/* -----------------------------------------------
   POST /api/ai/rag/index
----------------------------------------------- */
router.post('/index', async (req, res) => {
  const scope = workspaceScope(req, res);
  if (!scope) return;
  pub('rag.index.started', 'info', 'Indexation RAG locale demarree');
  try {
    const result = await indexSources(scope.explicit ? scope.options : {});
    pub('rag.index.completed', 'success',
        `RAG indexe : ${result.chunkCount} chunks (${result.mode})`);
    pub('workspace.rag.indexed', 'success', `RAG workspace ${scope.context.workspaceId} indexe`);
    res.json({ ok: true, workspaceId: scope.context.workspaceId, ...result });
  } catch (err) {
    pub('rag.index.failed', 'error', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* -----------------------------------------------
   POST /api/ai/rag/search
----------------------------------------------- */
router.post('/search', async (req, res) => {
  const { query, topK } = req.body || {};
  const scope = workspaceScope(req, res);
  if (!scope) return;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ ok: false, error: 'query_requis', chunks: [] });
  }
  const safeQuery = sanitizeQuestion(query);
  if (!safeQuery) {
    return res.status(400).json({ ok: false, error: 'query_vide', chunks: [] });
  }
  try {
    const result = await retrieve(safeQuery, scopedOptions(scope, { topK: typeof topK === 'number' ? topK : undefined }));
    const citations = formatCitations(result.chunks);
    pub('rag.search.completed', 'info',
        `RAG search (${result.mode}): ${result.chunks.length} resultats`);
    res.json({
      ok:        true,
      query:     safeQuery,
      workspaceId: scope.context.workspaceId,
      chunks:    citations,
      mode:      result.mode,
      indexed:   result.indexed,
      total:     citations.length,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message, chunks: [] });
  }
});

/* -----------------------------------------------
   POST /api/ai/rag/ask
----------------------------------------------- */
router.post('/ask', async (req, res) => {
  const { question, topK } = req.body || {};
  const scope = workspaceScope(req, res);
  if (!scope) return;
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ ok: false, error: 'question_requise', response: null, citations: [] });
  }
  const safeQuestion = sanitizeQuestion(question);
  if (!safeQuestion) {
    return res.status(400).json({ ok: false, error: 'question_vide', response: null, citations: [] });
  }

  try {
    const retrieval = await retrieve(safeQuestion, scopedOptions(scope, { topK: typeof topK === 'number' ? topK : undefined }));
    const citations = formatCitations(retrieval.chunks);
    const context   = buildContextBlock(retrieval.chunks);

    const userMsg = context
      ? `Contexte documentaire :\n\n${context}\n\nQuestion : ${safeQuestion}`
      : `Question : ${safeQuestion}\n(Aucun contexte documentaire indexe — reponds avec tes connaissances generales sur Sallon-ConnecT.)`;

    const result = await chat(RAG_SYSTEM_PROMPT, userMsg);

    pub('rag.ask.completed', result.ok ? 'success' : 'warning',
        result.ok ? `RAG ask termine (${retrieval.mode})` : (result.error || 'erreur_ia'));

    res.json({
      ok:        result.ok,
      workspaceId: scope.context.workspaceId,
      response:  result.response,
      error:     result.error,
      citations,
      mode:      retrieval.mode,
      indexed:   retrieval.indexed,
    });
  } catch (err) {
    pub('rag.ask.completed', 'error', err.message);
    res.status(500).json({ ok: false, error: err.message, response: null, citations: [] });
  }
});

/* -----------------------------------------------
   POST /api/ai/rag/clear
----------------------------------------------- */
router.post('/clear', (req, res) => {
  const { confirmation } = req.body || {};
  const scope = workspaceScope(req, res);
  if (!scope) return;
  if (confirmation !== 'EFFACER_INDEX') {
    return res.status(400).json({
      ok:    false,
      error: 'confirmation_requise',
      hint:  'Envoyer { "confirmation": "EFFACER_INDEX" } pour confirmer.',
    });
  }
  try {
    if (scope.explicit) clearAll(scope.options);
    else clearAll();
    pub('rag.clear.completed', 'info', 'Index RAG efface');
    res.json({ ok: true, workspaceId: scope.context.workspaceId, message: 'Index RAG efface.' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;

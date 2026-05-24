'use strict';

const express = require('express');
const router  = express.Router();

const ragRouter                                    = require('./aiRag');
const { getStatus, chat }                          = require('../ai/localAiClient');
const { analyzeDiagnostics }                       = require('../ai/aiDiagnosticsAssistant');
const { analyzeLogs }                              = require('../ai/aiLogAnalyzer');
const { isCommandSafe, sanitizeAiResponse,
        getAiSafety, maskSecrets, truncateInput }  = require('../ai/aiSafety');
const { COMMAND_SUGGESTION_PROMPT, CHAT_PROMPT }   = require('../ai/aiPromptTemplates');
const ollama                                       = require('../ai/ollamaClient');
const bus                                          = require('../services/serverEventBus');

function pub(type, severity, message) {
  try {
    bus.publish({ type, severity, source: 'backend', message });
  } catch { /* non bloquant */ }
}

/* -----------------------------------------------
   GET /api/ai/status
----------------------------------------------- */
router.get('/status', async (_req, res) => {
  try {
    const status = await getStatus();
    pub('ai.status.checked', 'info', `IA locale : ${status.available ? 'disponible' : 'indisponible'}`);
    if (!status.available && status.reason === 'ollama_indisponible') {
      pub('ai.ollama.unavailable', 'warning', 'Ollama non disponible sur localhost');
    }
    res.json({ ...status, safety: getAiSafety() });
  } catch (err) {
    res.status(500).json({ error: 'ai_status_failed', message: err.message });
  }
});

/* -----------------------------------------------
   GET /api/ai/models
----------------------------------------------- */
router.get('/models', async (_req, res) => {
  try {
    const models = await ollama.listModels();
    res.json({ models, total: models.length });
  } catch {
    res.json({ models: [], total: 0 });
  }
});

/* -----------------------------------------------
   POST /api/ai/diagnose
----------------------------------------------- */
router.post('/diagnose', async (req, res) => {
  const data = req.body?.snapshot || req.body?.context || {};
  pub('ai.request.started', 'info', 'Demande diagnose IA demarree');
  try {
    const result = await analyzeDiagnostics(data);
    pub(result.ok ? 'ai.request.completed' : 'ai.request.failed',
        result.ok ? 'success' : 'warning',
        result.ok ? 'Analyse diagnostics IA terminee' : (result.error || 'erreur_ia'));
    res.json(result);
  } catch (err) {
    pub('ai.request.failed', 'error', err.message);
    res.status(500).json({ ok: false, error: err.message, response: null });
  }
});

/* -----------------------------------------------
   POST /api/ai/analyze-logs
----------------------------------------------- */
router.post('/analyze-logs', async (req, res) => {
  const { logs } = req.body || {};
  if (!logs || typeof logs !== 'string') {
    return res.status(400).json({ ok: false, error: 'logs_requis', response: null });
  }
  pub('ai.request.started', 'info', 'Analyse logs IA demarree');
  try {
    const result = await analyzeLogs(logs);
    pub(result.ok ? 'ai.request.completed' : 'ai.request.failed',
        result.ok ? 'success' : 'warning',
        result.ok ? 'Analyse logs IA terminee' : (result.error || 'erreur_ia'));
    res.json(result);
  } catch (err) {
    pub('ai.request.failed', 'error', err.message);
    res.status(500).json({ ok: false, error: err.message, response: null });
  }
});

/* -----------------------------------------------
   POST /api/ai/suggest-command
----------------------------------------------- */
router.post('/suggest-command', async (req, res) => {
  const { task } = req.body || {};
  if (!task || typeof task !== 'string') {
    return res.status(400).json({ ok: false, error: 'task_requis', command: null, safe: false });
  }
  pub('ai.request.started', 'info', 'Suggestion commande IA demarree');
  try {
    const safeTask = truncateInput(maskSecrets(task), 2000);
    const msg      = `Genere une commande PowerShell sure pour : ${safeTask}. Rappelle explicitement [DRY-RUN - a executer manuellement].`;
    const result   = await chat(COMMAND_SUGGESTION_PROMPT, msg);

    if (!result.ok) {
      pub('ai.request.failed', 'warning', result.error || 'erreur_ia');
      return res.json({ ok: false, error: result.error, command: null, safe: false, dryRun: true });
    }

    const command  = result.response || '';
    const safety   = isCommandSafe(command);

    if (!safety.safe) {
      pub('ai.command.rejected.dangerous', 'warning', `Commande dangereuse rejetee : ${safety.reason}`);
      return res.json({ ok: false, error: 'commande_dangereuse', reason: safety.reason, command: null, safe: false, dryRun: true });
    }

    pub('ai.command.suggested.safe', 'success', 'Commande sure suggeree (dry-run)');
    res.json({ ok: true, command: sanitizeAiResponse(command), safe: true, dryRun: true, error: null });
  } catch (err) {
    pub('ai.request.failed', 'error', err.message);
    res.status(500).json({ ok: false, error: err.message, command: null, safe: false });
  }
});

/* -----------------------------------------------
   POST /api/ai/chat
----------------------------------------------- */
router.post('/chat', async (req, res) => {
  const { message } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ ok: false, error: 'message_requis', response: null });
  }
  pub('ai.request.started', 'info', 'Chat IA demarre');
  try {
    const result = await chat(CHAT_PROMPT, message);
    pub(result.ok ? 'ai.request.completed' : 'ai.request.failed',
        result.ok ? 'success' : 'warning',
        result.ok ? 'Chat IA termine' : (result.error || 'erreur_ia'));
    res.json(result);
  } catch (err) {
    pub('ai.request.failed', 'error', err.message);
    res.status(500).json({ ok: false, error: err.message, response: null });
  }
});

/* Phase 46 - RAG local */
router.use('/rag', ragRouter);

/* Phase 47 - Agents IA locaux orchestres */
const agentsRouter = require('./aiAgents');
router.use('/agents', agentsRouter);

/* Phase 48 - Workflows IA visuels */
const workflowsRouter = require('./aiWorkflows');
router.use('/workflows', workflowsRouter);

/* Phase 49 - Memoire persistante IA */
const memoryRouter = require('./aiMemory');
router.use('/memory', memoryRouter);

/* Phase 50 - Base de connaissances locale */
const knowledgeRouter = require('./aiKnowledge');
router.use('/knowledge', knowledgeRouter);

module.exports = router;

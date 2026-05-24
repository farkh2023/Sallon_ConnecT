'use strict';

const { isToolAllowed, sanitizeContext } = require('./agentSafety');

// Implementations legeres des outils autorises.
// Chaque outil lit l'etat local — aucune action destructive.

async function callTool(toolName, params, context, options = {}) {
  const check = isToolAllowed(toolName);
  if (!check.allowed) {
    return { ok: false, error: check.reason, toolName, rejected: true };
  }

  try {
    switch (toolName) {
      case 'diagnostics.read':   return await toolDiagnosticsRead();
      case 'rag.search':         return await toolRagSearch(params, options);
      case 'rag.ask':            return await toolRagAsk(params, options);
      case 'plugins.list':       return await toolPluginsList();
      case 'backups.status':     return await toolBackupsStatus();
      case 'updates.status':     return await toolUpdatesStatus();
      case 'service.status':     return await toolServiceStatus();
      case 'notifications.create': return await toolNotificationsCreate(params);
      case 'commands.suggestSafe': return toolCommandsSuggestSafe(params, context);
      default:
        return { ok: false, error: 'outil_inconnu', toolName, rejected: true };
    }
  } catch (err) {
    return { ok: false, error: err.message || 'erreur_outil', toolName };
  }
}

async function toolDiagnosticsRead() {
  try {
    const res = await fetch('http://127.0.0.1:3000/api/diagnostics/overview');
    if (!res.ok) return { ok: false, error: `http_${res.status}` };
    const data = await res.json();
    return {
      ok: true,
      score:    data.score,
      status:   data.status,
      cards:    (data.cards || []).map(c => ({ name: c.name, status: c.status, score: c.score })),
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function workspaceRequestOptions(options = {}, body = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const requestBody = { ...body };
  if (options.workspaceId) {
    headers['X-Workspace-Id'] = options.workspaceId;
    requestBody.workspaceId = options.workspaceId;
  }
  return { headers, body: requestBody };
}

async function toolRagSearch(params, options = {}) {
  const query = typeof params?.query === 'string' ? params.query.slice(0, 1000) : '';
  if (!query) return { ok: false, error: 'query_requis' };
  try {
    const req = workspaceRequestOptions(options, { query });
    const res = await fetch('http://127.0.0.1:3000/api/ai/rag/search', {
      method:  'POST',
      headers: req.headers,
      body:    JSON.stringify(req.body),
    });
    if (!res.ok) return { ok: false, error: `http_${res.status}` };
    const data = await res.json();
    return { ok: data.ok, chunks: data.chunks || [], mode: data.mode, total: data.total };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function toolRagAsk(params, options = {}) {
  const question = typeof params?.question === 'string' ? params.question.slice(0, 2000) : '';
  if (!question) return { ok: false, error: 'question_requis' };
  try {
    const req = workspaceRequestOptions(options, { question });
    const res = await fetch('http://127.0.0.1:3000/api/ai/rag/ask', {
      method:  'POST',
      headers: req.headers,
      body:    JSON.stringify(req.body),
    });
    if (!res.ok) return { ok: false, error: `http_${res.status}` };
    const data = await res.json();
    return { ok: data.ok, response: data.response, citations: data.citations || [], mode: data.mode };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function toolPluginsList() {
  try {
    const res = await fetch('http://127.0.0.1:3000/api/plugins');
    if (!res.ok) return { ok: false, error: `http_${res.status}` };
    const data = await res.json();
    const plugins = (data.plugins || data || []).map(p => ({
      id: p.id, name: p.name, enabled: p.enabled, version: p.version,
    }));
    return { ok: true, plugins, total: plugins.length };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function toolBackupsStatus() {
  try {
    const res = await fetch('http://127.0.0.1:3000/api/diagnostics/backup');
    if (!res.ok) return { ok: false, error: `http_${res.status}` };
    const data = await res.json();
    return {
      ok:          true,
      total:       data.total,
      lastBackup:  data.lastBackup,
      valid:       data.valid,
      size:        data.size,
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function toolUpdatesStatus() {
  try {
    const res = await fetch('http://127.0.0.1:3000/api/diagnostics/overview');
    if (!res.ok) return { ok: false, error: `http_${res.status}` };
    const data = await res.json();
    const updateCard = (data.cards || []).find(c => c.name === 'update' || c.name === 'Update');
    return { ok: true, status: updateCard?.status || 'unknown', score: updateCard?.score };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function toolServiceStatus() {
  try {
    const res = await fetch('http://127.0.0.1:3000/api/health');
    if (!res.ok) return { ok: false, error: `http_${res.status}` };
    const data = await res.json();
    return { ok: true, status: data.status, uptime: data.uptime, version: data.version };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function toolNotificationsCreate(params) {
  const message  = typeof params?.message === 'string' ? params.message.slice(0, 500) : '';
  const severity = ['info', 'success', 'warning', 'error'].includes(params?.severity)
    ? params.severity : 'info';
  if (!message) return { ok: false, error: 'message_requis' };
  try {
    const res = await fetch('http://127.0.0.1:3000/api/notifications', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ message, severity, source: 'agent' }),
    });
    if (!res.ok) return { ok: false, error: `http_${res.status}` };
    return { ok: true, sent: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function toolCommandsSuggestSafe(params, context) {
  const task = typeof params?.task === 'string' ? params.task.slice(0, 1000) : '';
  if (!task) return { ok: false, error: 'task_requis' };
  const ctx = sanitizeContext(context || '');
  // L'agent ne peut que suggerer — jamais executer
  return {
    ok:      true,
    command: null,
    note:    `[DRY-RUN] Suggestion demandee pour : "${task}". Contexte : ${ctx.slice(0, 200)}. A executer manuellement apres validation humaine.`,
    dryRun:  true,
  };
}

module.exports = { callTool };

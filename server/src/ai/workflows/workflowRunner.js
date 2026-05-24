'use strict';

const { topologicalSort, MAX_STEPS, TIMEOUT_MS, MAX_DELAY_MS } = require('./workflowTypes');
const { isNodeTypeAllowed, sanitizeWorkflowOutput } = require('./workflowSafety');
const { saveRun }            = require('./workflowStore');
const { runAgent }           = require('../agents/agentRunner');
const { getAgent }           = require('../agents/agentRegistry');
const { maskSecrets }        = require('../aiSafety');
const bus                    = require('../../services/serverEventBus');

function pub(type, severity, message) {
  try { bus.publish({ type, severity, source: 'workflows', message }); } catch { /* non bloquant */ }
}

function _runId() {
  return `wf${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Execute un workflow complet de facon sequentielle.
 */
async function runWorkflow(wf, options = {}) {
  const runId     = _runId();
  const startedAt = new Date().toISOString();
  const timeout   = TIMEOUT_MS;
  const workspaceId = options.workspaceId;

  pub('workflow.run.started', 'info', `Workflow "${wf.name}" (${runId}) demarre`);

  // Tri topologique
  let sorted;
  try {
    sorted = topologicalSort(wf.nodes);
  } catch (err) {
    pub('workflow.run.failed', 'error', `DAG invalide : ${err.message}`);
    return _failRun(runId, wf, startedAt, err.message, [], options);
  }

  // Limiter le nombre de steps
  const effectiveNodes = sorted.slice(0, MAX_STEPS);
  const nodeResults    = [];
  const allCitations   = [];
  const allRejected    = [];
  let   sharedContext  = '';

  for (const node of effectiveNodes) {
    pub('workflow.node.started', 'info', `Node "${node.id}" (${node.type}) demarre`);

    const check = isNodeTypeAllowed(node.type);
    if (!check.allowed) {
      const rejected = { nodeId: node.id, type: node.type, reason: check.reason };
      allRejected.push(rejected);
      pub('workflow.action.rejected', 'warning', `Node "${node.id}" rejete : ${check.reason}`);
      nodeResults.push({ nodeId: node.id, type: node.type, ok: false, error: check.reason, output: null, dryRun: true });
      continue;
    }

    try {
      const result = await _runWithTimeout(
        () => _executeNode(node, sharedContext, wf, options),
        timeout,
      );

      const safeOutput = result.output ? sanitizeWorkflowOutput(result.output) : null;

      nodeResults.push({
        nodeId:  node.id,
        label:   node.label || node.id,
        type:    node.type,
        ok:      result.ok,
        output:  safeOutput,
        error:   result.error || null,
        dryRun:  true,
      });

      if (result.citations?.length) allCitations.push(...result.citations);
      if (result.rejectedActions?.length) allRejected.push(...result.rejectedActions);

      // Accumuler contexte
      if (safeOutput) {
        sharedContext = maskSecrets(`${sharedContext}\n\n[${node.label || node.id}]:\n${safeOutput}`).slice(0, 6000);
      }

      pub('workflow.node.completed', result.ok ? 'success' : 'warning', `Node "${node.id}" termine`);
    } catch (err) {
      const msg = maskSecrets(err.message || 'erreur_node');
      nodeResults.push({ nodeId: node.id, label: node.label || node.id, type: node.type, ok: false, error: msg, output: null, dryRun: true });
      pub('workflow.node.failed', 'error', `Node "${node.id}" echoue : ${msg}`);
    }
  }

  const status      = nodeResults.some(r => r.ok) ? 'completed' : 'failed';
  const completedAt = new Date().toISOString();

  const summary = nodeResults
    .filter(r => r.ok && r.output)
    .map(r => `[${r.label}]: ${r.output.slice(0, 400)}`)
    .join('\n\n') || 'Aucun output produit.';

  const runData = {
    runId,
    workspaceId,
    workflowId:   wf.id,
    workflowName: wf.name,
    status,
    nodeResults,
    citations:    allCitations.slice(0, 20),
    rejectedActions: allRejected.slice(0, 20),
    safetySummary: {
      localOnly:       true,
      dryRun:          true,
      noAutoExecution: true,
      nodesRun:        nodeResults.length,
      nodesFailed:     nodeResults.filter(r => !r.ok).length,
      rejectedTotal:   allRejected.length,
    },
    summary,
    startedAt,
    completedAt,
    dryRun: true,
  };

  try { saveRun(runId, runData, workspaceId ? { workspaceId } : undefined); } catch { /* non bloquant */ }

  if (status === 'completed') {
    pub('workflow.run.completed', 'success', `Workflow "${wf.name}" termine (${nodeResults.length} nodes)`);
    pub('workspace.workflow.run.created', 'success', `Run workflow ${runId} cree`);
  } else {
    pub('workflow.run.failed', 'error', `Workflow "${wf.name}" echoue`);
  }

  return runData;
}

/**
 * Execute un noeud selon son type.
 */
async function _executeNode(node, context, wf, options = {}) {
  switch (node.type) {
    case 'agent': {
      const agent = getAgent(node.agentId);
      if (!agent) return { ok: false, error: `agent_introuvable: ${node.agentId}`, output: null };
      const task  = node.task || wf.description || wf.name || 'tache workflow';
      const result = await runAgent(agent, maskSecrets(String(task).slice(0, 2000)), context, options);
      return {
        ok:              result.ok,
        output:          result.output,
        error:           result.error || null,
        citations:       result.citations || [],
        rejectedActions: result.rejectedActions || [],
      };
    }

    case 'rag-search': {
      const query = node.query || context.slice(0, 200) || 'recherche documentation';
      const res = await _fetch('POST', '/api/ai/rag/search', { query }, options);
      return {
        ok:     res.ok,
        output: res.ok ? JSON.stringify({ chunks: (res.chunks || []).length, mode: res.mode }) : null,
        error:  res.ok ? null : (res.error || 'erreur_rag_search'),
        citations: (res.chunks || []).map((c, i) => ({
          index: i + 1, source: c.source, heading: c.heading,
          excerpt: (c.text || '').slice(0, 200), score: c._score,
        })),
      };
    }

    case 'rag-ask': {
      const question = node.question || 'Qu\'est-ce que Sallon-ConnecT ?';
      const res      = await _fetch('POST', '/api/ai/rag/ask', { question }, options);
      return {
        ok:        res.ok,
        output:    res.response || null,
        error:     res.ok ? null : (res.error || 'erreur_rag_ask'),
        citations: res.citations || [],
      };
    }

    case 'diagnostic': {
      const res = await _fetch('GET', '/api/diagnostics/overview');
      return {
        ok:     !!res.status,
        output: res.status ? `Score: ${res.score}, Status: ${res.status}` : null,
        error:  res.status ? null : 'erreur_diagnostics',
      };
    }

    case 'notification': {
      const msg      = node.message || `Workflow ${wf.name} (dry-run)`;
      const severity = ['info', 'success', 'warning', 'error'].includes(node.severity) ? node.severity : 'info';
      const res = await _fetch('POST', '/api/notifications', { message: msg.slice(0, 500), severity, source: 'workflow' });
      return { ok: !!(res.ok !== false), output: 'Notification envoyee (dry-run)', error: null };
    }

    case 'condition': {
      const value     = String(context).toLowerCase();
      const condition = String(node.condition || '').toLowerCase();
      const matched   = condition ? value.includes(condition) : true;
      return { ok: true, output: `Condition "${condition}": ${matched ? 'vraie' : 'fausse'}`, error: null };
    }

    case 'delay': {
      const ms = Math.min(Number(node.delayMs || 0), MAX_DELAY_MS);
      if (ms > 0) await new Promise(r => setTimeout(r, ms));
      return { ok: true, output: `Delai ${ms}ms applique (dry-run)`, error: null };
    }

    case 'safe-command-suggestion': {
      const task = node.task || 'tache workflow';
      // Suggestion uniquement — jamais executee
      return {
        ok:     true,
        output: `[DRY-RUN] Suggestion demandee pour : "${task.slice(0, 200)}". A executer manuellement.`,
        error:  null,
      };
    }

    case 'plugin-tool': {
      const res = await _fetch('GET', '/api/plugins');
      const plugins = (res.plugins || res || []).map(p => `${p.name} (${p.enabled ? 'actif' : 'inactif'})`);
      return {
        ok:     true,
        output: `${plugins.length} plugin(s) : ${plugins.join(', ') || 'aucun'}`,
        error:  null,
      };
    }

    default:
      return { ok: false, error: `type_noeud_inconnu: ${node.type}`, output: null };
  }
}

async function _fetch(method, path, body, options = {}) {
  try {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    const requestBody = { ...(body || {}) };
    if (options.workspaceId) {
      opts.headers['X-Workspace-Id'] = options.workspaceId;
      requestBody.workspaceId = options.workspaceId;
    }
    if (body || options.workspaceId) opts.body = JSON.stringify(requestBody);
    const res  = await fetch(`http://127.0.0.1:3000${path}`, opts);
    if (!res.ok) return { ok: false, error: `http_${res.status}` };
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function _runWithTimeout(fn, ms) {
  return Promise.race([
    fn(),
    new Promise(resolve => setTimeout(() => resolve({ ok: false, error: 'timeout_workflow' }), ms)),
  ]);
}

function _failRun(runId, wf, startedAt, error, nodeResults, options = {}) {
  const runData = {
    runId,
    workspaceId:      options.workspaceId,
    workflowId:      wf.id,
    workflowName:    wf.name,
    status:          'failed',
    nodeResults,
    citations:       [],
    rejectedActions: [],
    safetySummary:   { localOnly: true, dryRun: true, noAutoExecution: true, nodesRun: 0, nodesFailed: 0, rejectedTotal: 0 },
    summary:         null,
    startedAt,
    completedAt:     new Date().toISOString(),
    dryRun:          true,
    error,
  };
  try { saveRun(runId, runData, options.workspaceId ? { workspaceId: options.workspaceId } : undefined); } catch { /* non bloquant */ }
  return runData;
}

module.exports = { runWorkflow };

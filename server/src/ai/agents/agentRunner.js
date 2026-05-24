'use strict';

const { chat }             = require('../localAiClient');
const { callTool }         = require('./agentTools');
const { getPrompt }        = require('./agentPrompts');
const { sanitizeStep,
        isToolAllowed }    = require('./agentSafety');
const { maskSecrets,
        truncateInput }    = require('../aiSafety');

/**
 * Execute un seul agent sur une tache donnee.
 * Retourne { agentId, steps, output, citations, rejectedActions, ok }
 */
async function runAgent(agent, task, contextIn, options = {}) {
  const steps          = [];
  const rejectedActions = [];
  const citations      = [];
  const timeout        = agent.timeout || 45000;
  const systemPrompt   = getPrompt(agent.id);

  const safeTask    = truncateInput(maskSecrets(task), 2000);
  const safeContext = contextIn ? maskSecrets(String(contextIn)).slice(0, 3000) : '';

  // Etape 1 : collecter donnees via outils
  for (const toolName of (agent.tools || [])) {
    const toolCheck = isToolAllowed(toolName);
    if (!toolCheck.allowed) {
      rejectedActions.push({ tool: toolName, reason: toolCheck.reason });
      continue;
    }

    const toolParams = _buildToolParams(toolName, safeTask);
    const stepResult = await _runWithTimeout(
      () => callTool(toolName, toolParams, safeContext, options),
      timeout,
    );

    const step = sanitizeStep({
      tool:   toolName,
      input:  JSON.stringify(toolParams),
      output: JSON.stringify(stepResult),
      ok:     stepResult.ok !== false,
      error:  stepResult.ok === false ? (stepResult.error || 'erreur') : null,
    });
    steps.push(step);

    // Collecter citations RAG si presentes
    if (stepResult.citations && Array.isArray(stepResult.citations)) {
      citations.push(...stepResult.citations);
    }
  }

  // Etape 2 : synthese par l'IA
  const toolSummary = steps
    .map(s => `[${s.tool}]: ${s.output.slice(0, 800)}`)
    .join('\n');

  const userMessage = `Tache : ${safeTask}\n\nDonnees collectees :\n${toolSummary}${
    safeContext ? `\n\nContexte precedent :\n${safeContext}` : ''
  }`;

  const aiResult = await _runWithTimeout(
    () => chat(systemPrompt, userMessage),
    timeout,
  );

  const output = aiResult.ok ? maskSecrets(aiResult.response || '') : null;

  return {
    agentId:         agent.id,
    agentName:       agent.name,
    steps,
    output,
    citations,
    rejectedActions,
    ok:              aiResult.ok,
    error:           aiResult.ok ? null : (aiResult.error || 'erreur_ia'),
    dryRun:          true,
  };
}

function _buildToolParams(toolName, task) {
  switch (toolName) {
    case 'rag.search':         return { query: task };
    case 'rag.ask':            return { question: task };
    case 'commands.suggestSafe': return { task };
    case 'notifications.create': return { message: `Agent : ${task.slice(0, 100)}`, severity: 'info' };
    default:                   return {};
  }
}

async function _runWithTimeout(fn, ms) {
  return Promise.race([
    fn(),
    new Promise(resolve =>
      setTimeout(() => resolve({ ok: false, error: 'timeout_agent' }), ms)
    ),
  ]);
}

module.exports = { runAgent };

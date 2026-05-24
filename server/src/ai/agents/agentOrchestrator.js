'use strict';

const { runAgent }      = require('./agentRunner');
const { getAgent,
        listAgents }    = require('./agentRegistry');
const { saveRun }       = require('./agentMemory');
const { chat }          = require('../localAiClient');
const { getPrompt }     = require('./agentPrompts');
const { maskSecrets,
        truncateInput } = require('../aiSafety');
const { sanitizeContext } = require('./agentSafety');
const bus               = require('../../services/serverEventBus');

const MAX_STEPS = parseInt(process.env.SALLON_AGENTS_MAX_STEPS || '6', 10);

function pub(type, severity, message) {
  try { bus.publish({ type, severity, source: 'agents', message }); } catch { /* non bloquant */ }
}

/**
 * Lance une execution orchestree sequentielle.
 * @returns {Promise<{runId, status, steps, agentsUsed, recommendations, citations, rejectedActions, safetySummary}>}
 */
async function orchestrate(options) {
  const {
    task,
    selectedAgents,
    useRag      = false,
    maxSteps    = MAX_STEPS,
    dryRun      = true,
    workspaceId,
  } = options;

  const runId     = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const startedAt = new Date().toISOString();

  pub('agent.run.started', 'info', `Run ${runId} demarre : "${String(task).slice(0, 80)}"`);

  // Choisir les agents a utiliser
  const allAgents  = listAgents().filter(a => a.enabled);
  let agentsToRun  = allAgents;

  if (Array.isArray(selectedAgents) && selectedAgents.length > 0) {
    agentsToRun = selectedAgents
      .map(id => getAgent(id))
      .filter(Boolean)
      .filter(a => a.enabled);
  }

  // Si RAG demande et docs-agent non selectionne, l'ajouter
  if (useRag && !agentsToRun.find(a => a.id === 'docs-agent')) {
    const docsAgent = getAgent('docs-agent');
    if (docsAgent?.enabled) agentsToRun.push(docsAgent);
  }

  // Limiter le nombre de steps total
  const effectiveMax = Math.min(maxSteps, MAX_STEPS);
  const stepsResult  = [];
  let   contextAcc   = '';
  const allCitations = [];
  const allRejected  = [];

  let stepCount = 0;
  for (const agent of agentsToRun) {
    if (stepCount >= effectiveMax) break;

    pub('agent.step.started', 'info', `Agent ${agent.id} demarre`);
    try {
      const result = await runAgent(agent, truncateInput(maskSecrets(task), 2000), contextAcc, { workspaceId });

      stepsResult.push({
        agentId:        agent.id,
        agentName:      agent.name,
        steps:          result.steps,
        output:         result.output,
        ok:             result.ok,
        error:          result.error,
        citations:      result.citations,
        rejectedActions: result.rejectedActions,
        dryRun:         true,
      });

      // Accumuler le contexte pour l'agent suivant
      if (result.output) {
        contextAcc = sanitizeContext(`${contextAcc}\n\n[${agent.name}]:\n${result.output}`);
      }

      if (result.citations?.length) allCitations.push(...result.citations);
      if (result.rejectedActions?.length) allRejected.push(...result.rejectedActions);

      pub('agent.step.completed', 'success', `Agent ${agent.id} termine`);
    } catch (err) {
      stepsResult.push({
        agentId: agent.id, agentName: agent.name,
        steps: [], output: null, ok: false,
        error: maskSecrets(err.message || 'erreur_agent'),
        citations: [], rejectedActions: [], dryRun: true,
      });
      pub('agent.step.failed', 'error', `Agent ${agent.id} echoue : ${err.message}`);
    }
    stepCount++;
  }

  // Synthese finale par l'orchestrateur
  const recommendations = [];
  const { summary, safetySummary } = await _buildSynthesis(task, stepsResult, dryRun);

  // Extraire les recommandations depuis les outputs
  for (const step of stepsResult) {
    if (step.output) {
      recommendations.push({
        agentId:   step.agentId,
        agentName: step.agentName,
        text:      step.output.slice(0, 1000),
        dryRun:    true,
      });
    }
  }

  const completedAt = new Date().toISOString();
  const status = stepsResult.some(s => s.ok) ? 'completed' : 'failed';

  const runData = {
    runId,
    workspaceId,
    status,
    task:           truncateInput(maskSecrets(task), 500),
    agentsUsed:     stepsResult.map(s => s.agentId),
    steps:          stepsResult,
    recommendations,
    citations:      allCitations.slice(0, 20),
    rejectedActions: allRejected.slice(0, 20),
    safetySummary,
    summary,
    startedAt,
    completedAt,
    dryRun:         true,
  };

  try { saveRun(runId, runData, workspaceId ? { workspaceId } : undefined); } catch { /* non bloquant */ }

  if (status === 'completed') {
    pub('agent.run.completed', 'success', `Run ${runId} termine avec ${stepsResult.length} agents`);
    pub('workspace.agent.run.created', 'success', `Run agents ${runId} cree`);
  } else {
    pub('agent.run.failed', 'error', `Run ${runId} echoue`);
  }

  return runData;
}

async function _buildSynthesis(task, stepsResult, _dryRun) {
  const agentOutputs = stepsResult
    .filter(s => s.ok && s.output)
    .map(s => `[${s.agentName}]:\n${s.output.slice(0, 800)}`)
    .join('\n\n');

  if (!agentOutputs) {
    return {
      summary: 'Aucun agent n\'a produit de resultat exploitable.',
      safetySummary: { localOnly: true, dryRun: true, noAutoExecution: true, agentsRun: stepsResult.length },
    };
  }

  const synthesisPrompt = getPrompt('orchestrator');
  const synthesisInput  = `Tache originale : ${String(task).slice(0, 500)}\n\nResultats agents :\n${agentOutputs}`;

  const synthResult = await chat(synthesisPrompt, synthesisInput).catch(() => ({ ok: false, response: null }));
  const summary     = synthResult.ok ? maskSecrets(synthResult.response || '') : agentOutputs.slice(0, 2000);

  return {
    summary,
    safetySummary: {
      localOnly:       true,
      dryRun:          true,
      noAutoExecution: true,
      agentsRun:       stepsResult.length,
      agentsFailed:    stepsResult.filter(s => !s.ok).length,
      rejectedTotal:   stepsResult.reduce((acc, s) => acc + (s.rejectedActions?.length || 0), 0),
    },
  };
}

module.exports = { orchestrate };

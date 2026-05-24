'use strict';

/**
 * Types, validation et constantes des workflows IA locaux Phase 48.
 */

const ALLOWED_NODE_TYPES = new Set([
  'agent',
  'rag-search',
  'rag-ask',
  'diagnostic',
  'notification',
  'condition',
  'delay',
  'safe-command-suggestion',
  'plugin-tool',
]);

const FORBIDDEN_NODE_TYPES = new Set([
  'shell-execute',
  'restore-apply',
  'update-apply',
  'delete-files',
  'network-external',
  'secrets-read',
]);

const MAX_NODES    = parseInt(process.env.SALLON_WORKFLOWS_MAX_NODES   || '25', 10);
const MAX_STEPS    = parseInt(process.env.SALLON_WORKFLOWS_MAX_STEPS   || '30', 10);
const TIMEOUT_MS   = parseInt(process.env.SALLON_WORKFLOWS_TIMEOUT_MS  || '120000', 10);
const MAX_DELAY_MS = 10000; // delai max autorise dans un node delay

/**
 * Valide un WorkflowDefinition complet.
 */
function validateWorkflow(wf) {
  const errors = [];

  if (!wf.id || typeof wf.id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(wf.id))
    errors.push('id_invalide');
  if (!wf.name || typeof wf.name !== 'string')
    errors.push('name_requis');
  if (wf.localOnly !== true)
    errors.push('localOnly_doit_etre_true');
  if (wf.dryRun !== true)
    errors.push('dryRun_doit_etre_true');
  if (!Array.isArray(wf.nodes) || wf.nodes.length === 0)
    errors.push('nodes_requis');
  if (wf.nodes && wf.nodes.length > MAX_NODES)
    errors.push(`trop_de_nodes_max_${MAX_NODES}`);

  // Validation de chaque noeud
  const nodeIds = new Set();
  for (const node of (wf.nodes || [])) {
    if (!node.id || typeof node.id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(node.id)) {
      errors.push(`node_id_invalide: ${node.id}`);
      continue;
    }
    if (nodeIds.has(node.id)) {
      errors.push(`node_id_duplique: ${node.id}`);
    }
    nodeIds.add(node.id);

    if (FORBIDDEN_NODE_TYPES.has(node.type)) {
      errors.push(`node_type_interdit: ${node.type}`);
    } else if (!ALLOWED_NODE_TYPES.has(node.type)) {
      errors.push(`node_type_inconnu: ${node.type}`);
    }

    // Validation delay
    if (node.type === 'delay') {
      const ms = Number(node.delayMs || 0);
      if (ms > MAX_DELAY_MS) errors.push(`delay_trop_long_max_${MAX_DELAY_MS}ms`);
    }
  }

  // Validation cycle DAG
  if (errors.length === 0 && wf.nodes) {
    const cycle = detectCycle(wf.nodes);
    if (cycle) errors.push(`cycle_detecte: ${cycle}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Detection de cycle dans les dependances.
 * Retourne le noeud implique ou null.
 */
function detectCycle(nodes) {
  const adj = new Map();
  for (const node of nodes) {
    adj.set(node.id, node.dependsOn || []);
  }

  const visited = new Set();
  const inStack = new Set();

  function dfs(id) {
    if (inStack.has(id)) return id;
    if (visited.has(id)) return null;
    visited.add(id);
    inStack.add(id);
    for (const dep of (adj.get(id) || [])) {
      const cycle = dfs(dep);
      if (cycle) return cycle;
    }
    inStack.delete(id);
    return null;
  }

  for (const node of nodes) {
    const cycle = dfs(node.id);
    if (cycle) return cycle;
  }
  return null;
}

/**
 * Tri topologique des noeuds.
 * Retourne le tableau ordonne ou lance une erreur si cycle.
 */
function topologicalSort(nodes) {
  const adj = new Map();
  const indegree = new Map();

  for (const node of nodes) {
    adj.set(node.id, []);
    indegree.set(node.id, 0);
  }
  for (const node of nodes) {
    for (const dep of (node.dependsOn || [])) {
      const list = adj.get(dep) || [];
      list.push(node.id);
      adj.set(dep, list);
      indegree.set(node.id, (indegree.get(node.id) || 0) + 1);
    }
  }

  const queue = nodes.filter(n => (indegree.get(n.id) || 0) === 0).map(n => n.id);
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const sorted = [];

  while (queue.length > 0) {
    const id = queue.shift();
    sorted.push(nodeMap.get(id));
    for (const next of (adj.get(id) || [])) {
      const deg = (indegree.get(next) || 1) - 1;
      indegree.set(next, deg);
      if (deg === 0) queue.push(next);
    }
  }

  if (sorted.length !== nodes.length) throw new Error('cycle_dans_dag');
  return sorted;
}

module.exports = {
  ALLOWED_NODE_TYPES, FORBIDDEN_NODE_TYPES,
  MAX_NODES, MAX_STEPS, TIMEOUT_MS, MAX_DELAY_MS,
  validateWorkflow, detectCycle, topologicalSort,
};

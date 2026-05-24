'use strict';

const { BUILT_IN_AGENTS, validateManifest } = require('./agentTypes');

// Registre en memoire — initialisé depuis les agents integres
const _registry = new Map();

function _init() {
  for (const agent of BUILT_IN_AGENTS) {
    _registry.set(agent.id, { ...agent });
  }
}
_init();

function listAgents() {
  return Array.from(_registry.values());
}

function getAgent(id) {
  if (typeof id !== 'string' || !id) return null;
  return _registry.get(id) || null;
}

function registerAgent(manifest) {
  const check = validateManifest(manifest);
  if (!check.valid) {
    return { ok: false, errors: check.errors };
  }
  _registry.set(manifest.id, { ...manifest });
  return { ok: true, id: manifest.id };
}

function isAgentEnabled(id) {
  const agent = getAgent(id);
  return agent ? agent.enabled === true : false;
}

module.exports = { listAgents, getAgent, registerAgent, isAgentEnabled };

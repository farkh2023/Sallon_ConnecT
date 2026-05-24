'use strict';

const { MAX_ENTITIES } = require('./knowledgeTypes');

const KNOWN_ENTITIES = [
  'ollama', 'rag', 'workflow', 'agent', 'plugin', 'diagnostic',
  'backup', 'memory', 'knowledge', 'embedding', 'llm', 'api',
  'dashboard', 'widget', 'notification', 'scheduler', 'runner',
];

function extractEntities(text) {
  if (!text || typeof text !== 'string') return [];
  const lower = text.toLowerCase();
  const found = new Set();
  for (const e of KNOWN_ENTITIES) {
    if (lower.includes(e)) found.add(e);
  }
  // Extract capitalised words as candidate entities (min 4 chars)
  const caps = text.match(/\b[A-Z][a-zA-Z]{3,}\b/g) || [];
  for (const c of caps) {
    if (found.size >= MAX_ENTITIES) break;
    found.add(c.toLowerCase());
  }
  return [...found].slice(0, MAX_ENTITIES);
}

function mergeEntities(existing = [], extracted = []) {
  const merged = new Set([...existing, ...extracted]);
  return [...merged].slice(0, MAX_ENTITIES);
}

module.exports = { extractEntities, mergeEntities };

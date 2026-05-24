'use strict';

const { MAX_ITEMS, MAX_ITEM_CHARS } = require('./memoryTypes');

const SECRET_PATTERNS = [
  /Bearer\s+\S+/gi,
  /api[_-]?keys?\s*[:=]\s*\S+/gi,
  /token\s*[:=]\s*\S+/gi,
  /password\s*[:=]\s*\S+/gi,
  /secret\s*[:=]\s*\S+/gi,
  /C:\\Users\\\w+/gi,
  /\/home\/\w+/gi,
];

function maskSecretPatterns(text) {
  if (typeof text !== 'string') return text;
  let result = text;
  for (const p of SECRET_PATTERNS) {
    result = result.replace(p, '[MASQUE]');
  }
  return result;
}

function sanitizeMemoryItem(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
  return {
    ...item,
    content: maskSecretPatterns(String(item.content || '')).slice(0, MAX_ITEM_CHARS()),
    tags:    Array.isArray(item.tags) ? item.tags.map(t => String(t).slice(0, 50)) : [],
  };
}

function sanitizeForExport(item) {
  if (!item) return null;
  // eslint-disable-next-line no-unused-vars
  const { embeddingHash: _e, ...rest } = item;
  return {
    ...rest,
    content:   maskSecretPatterns(item.content || ''),
    localOnly: true,
  };
}

function getMemorySafety() {
  return {
    localOnly:              true,
    noCloudAllowed:         true,
    secretMaskingEnabled:   true,
    humanControlRequired:   true,
    exportSanitized:        true,
    memoryTypes:  ['preference', 'fact', 'summary', 'workflow-result', 'agent-result', 'diagnostic-insight', 'note'],
    memoryScopes: ['user', 'project', 'system', 'session'],
    maxItems:           MAX_ITEMS(),
    maxItemChars:       MAX_ITEM_CHARS(),
    embeddingsEnabled:  process.env.SALLON_AI_MEMORY_EMBEDDINGS_ENABLED === 'true',
    includeInRag:       process.env.SALLON_AI_MEMORY_INCLUDE_IN_RAG      === 'true',
  };
}

module.exports = {
  maskSecretPatterns,
  sanitizeMemoryItem,
  sanitizeForExport,
  getMemorySafety,
};

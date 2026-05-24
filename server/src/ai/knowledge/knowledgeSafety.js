'use strict';

const SECRET_PATTERNS = [
  /Bearer\s+\S+/gi,
  /api[_-]?key\s*[:=]\s*\S+/gi,
  /token\s*[:=]\s*\S+/gi,
  /password\s*[:=]\s*\S+/gi,
  /secret\s*[:=]\s*\S+/gi,
  /C:\\Users\\\S+/gi,
  /\/home\/\S+/gi,
  /Authorization:\s*\S+/gi,
];

function maskSecrets(text) {
  if (typeof text !== 'string') return text;
  let out = text;
  for (const re of SECRET_PATTERNS) out = out.replace(re, '[MASQUE]');
  return out;
}

function sanitizeKbItem(item) {
  if (!item) return item;
  return {
    ...item,
    title:   maskSecrets(item.title),
    content: maskSecrets(item.content),
    localOnly: true,
  };
}

function sanitizeForCitation(item) {
  return {
    id:        item.id,
    type:      item.type,
    title:     maskSecrets(item.title),
    tags:      Array.isArray(item.tags) ? item.tags : [],
    entities:  Array.isArray(item.entities) ? item.entities : [],
    sourceId:  item.sourceId || null,
    importance: item.importance || 1,
    createdAt: item.createdAt,
  };
}

function getKnowledgeSafety() {
  return {
    localOnly:             true,
    noCloudAllowed:        true,
    secretMaskingEnabled:  true,
    pathTraversalBlocked:  true,
    clearRequiresConfirmation: true,
    importExportDisabled:  true,
    embeddingsOptional:    true,
  };
}

function validateId(id) {
  return typeof id === 'string' && /^[a-zA-Z0-9_-]+$/.test(id);
}

module.exports = { maskSecrets, sanitizeKbItem, sanitizeForCitation, getKnowledgeSafety, validateId };

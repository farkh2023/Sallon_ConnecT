'use strict';

const { BLOCKED_ACTIONS } = require('./globalSearchTypes');

const SECRET_PATTERNS = [
  /Bearer\s+\S+/gi,
  /api[_-]?key\s*[:=]\s*\S+/gi,
  /token\s*[:=]\s*\S+/gi,
  /password\s*[:=]\s*\S+/gi,
  /secret\s*[:=]\s*\S+/gi,
  /C:\\Users\\\S+/gi,
  /\/home\/\S+/gi,
];

function maskSecrets(text) {
  if (typeof text !== 'string') return text;
  let out = text;
  for (const re of SECRET_PATTERNS) out = out.replace(re, '[MASQUE]');
  return out;
}

function sanitizeResult(result) {
  return {
    ...result,
    title:       maskSecrets(result.title),
    description: maskSecrets(result.description),
    localOnly:   true,
  };
}

function isActionBlocked(action) {
  return BLOCKED_ACTIONS.has(action);
}

function validateCommandId(id) {
  return typeof id === 'string' && /^[a-zA-Z0-9._-]+$/.test(id) && !id.includes('..');
}

function getSearchSafety() {
  return {
    localOnly:              true,
    noCloudAllowed:         true,
    secretMaskingEnabled:   true,
    blockedActions:         [...BLOCKED_ACTIONS],
    historyLocalOnly:       true,
    clearHistoryConfirm:    true,
  };
}

module.exports = { maskSecrets, sanitizeResult, isActionBlocked, validateCommandId, getSearchSafety };

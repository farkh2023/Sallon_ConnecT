'use strict';

const MAX_CLIENTS = 50;
const VALID_SEVERITIES = new Set(['info', 'success', 'warning', 'error']);
const VALID_SOURCES = new Set(['backend', 'frontend', 'network', 'scheduler', 'backup', 'security', 'notifications']);

const _clients = new Map();
let _clientIdCounter = 0;

function _maskSensitive(text) {
  if (typeof text !== 'string') return String(text ?? '');
  return text
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [masqué]')
    .replace(/\bpassword\s*=\s*\S+/gi, 'password=[masqué]')
    .replace(/\btoken\s*=\s*[A-Za-z0-9._~+/=-]{8,}/gi, 'token=[masqué]')
    .replace(/[A-Za-z]:\\(?:[^\\/:*?"<>|\r\n]+\\)*/g, '[chemin-masqué]');
}

function _sanitizeEvent(event) {
  const id = event.id || `srv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  return {
    id,
    timestamp: typeof event.timestamp === 'string' ? event.timestamp : new Date().toISOString(),
    type: String(event.type || 'system.event').slice(0, 80),
    severity: VALID_SEVERITIES.has(event.severity) ? event.severity : 'info',
    source: VALID_SOURCES.has(event.source) ? event.source : 'backend',
    message: _maskSensitive(String(event.message || '')).slice(0, 500),
    ...(event.details ? { details: _maskSensitive(String(event.details)).slice(0, 200) } : {}),
  };
}

function subscribe(res) {
  if (_clients.size >= MAX_CLIENTS) return null;
  const id = ++_clientIdCounter;
  _clients.set(id, res);
  return id;
}

function unsubscribe(id) {
  _clients.delete(id);
}

function publish(event) {
  if (_clients.size === 0) return;
  const safe = _sanitizeEvent(event);
  const data = `data: ${JSON.stringify(safe)}\n\n`;
  for (const [id, res] of _clients) {
    try {
      res.write(data);
    } catch {
      _clients.delete(id);
    }
  }
}

function getClientCount() {
  return _clients.size;
}

module.exports = { subscribe, unsubscribe, publish, getClientCount, _sanitizeEvent };

'use strict';

const path = require('path');

const RE_BEARER = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi;
const RE_SECRET_ASSIGNMENT = /\b(?:token|secret|password|api[_-]?key|key)\s*[:=]\s*[^,\s"']+/gi;
const RE_IMEI = /\b\d{15}\b/g;
const RE_LOCAL_IP = /\b(?:(?:192\.168|10\.|172\.(?:1[6-9]|2\d|3[01]))\.\d{1,3}\.\d{1,3})\b/g;
const RE_ABS_PATH_WIN = /[A-Za-z]:\\[^\s"',;]+/g;
const RE_ABS_PATH_UNIX = /\/(?:Users|home|root|etc|var|tmp|mnt|media|Volumes)\/[^\s"',;]*/g;
const RE_UUID = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
const RE_LONG_KEY = /\b[A-Za-z0-9._-]{32,}\b/g;
const RE_SUSPICIOUS_NAME = /token|secret|password|apikey|api-key|imei|bearer/i;

function maskSensitiveText(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(RE_BEARER, 'Bearer [masked]')
    .replace(RE_SECRET_ASSIGNMENT, '[secret-masked]')
    .replace(RE_IMEI, '[imei-masked]')
    .replace(RE_LOCAL_IP, '[ip-masked]')
    .replace(RE_ABS_PATH_WIN, '[path-masked]')
    .replace(RE_ABS_PATH_UNIX, '[path-masked]')
    .replace(RE_UUID, (id) => `${id.slice(0, 4)}***`)
    .replace(RE_LONG_KEY, '[id-masked]');
}

function safeName(name) {
  const base = path.basename(String(name || ''));
  if (!base || RE_SUSPICIOUS_NAME.test(base)) return '[hidden-name]';
  return maskSensitiveText(base).slice(0, 96);
}

function roundSize(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${Math.round((value / 1024 / 1024) * 10) / 10} MB`;
}

function sanitizeForResponse(value) {
  if (typeof value === 'string') return maskSensitiveText(value);
  if (value == null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(sanitizeForResponse);

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, sanitizeForResponse(item)])
  );
}

function summarizeStatuses(items) {
  const statuses = items.filter(Boolean);
  if (statuses.includes('error')) return 'error';
  if (statuses.includes('warning')) return 'warning';
  return 'ok';
}

module.exports = {
  maskSensitiveText,
  safeName,
  roundSize,
  sanitizeForResponse,
  summarizeStatuses,
};

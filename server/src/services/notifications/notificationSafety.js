'use strict';
/* =============================================
   notificationSafety.js — Phase 12
   Sécurité centrale du module notifications.
   Aucune donnée sensible dans les messages.
   Local uniquement — jamais de push cloud.
============================================= */

/* ── Patterns de données sensibles ────────── */

/* Token SmartThings / Bearer */
const RE_TOKEN       = /Bearer\s+\S+|token[=:]\s*\S+/gi;
/* IMEI 15 chiffres */
const RE_IMEI        = /\b\d{15}\b/g;
/* Numéros de téléphone (formats courants) */
const RE_PHONE       = /\b(?:\+33|0033|0)[1-9](?:[\s.\-]?\d{2}){4}\b/g;
/* Numéros de série alphanumériques 8+ caractères */
const RE_SERIAL      = /\bSN[:\s]?[A-Z0-9]{6,}\b/gi;
/* Adresses MAC */
const RE_MAC         = /\b(?:[0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2}\b/g;
/* IP locales complètes (192.168.x.x, 10.x.x.x, 172.16-31.x.x) */
const RE_LOCAL_IP    = /\b(?:192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})\b/g;
/* Chemins absolus Windows ou Unix */
const RE_ABS_PATH_WIN = /[A-Za-z]:\\[^\s"',;]+/g;
const RE_ABS_PATH_UNIX = /\/(?:home|root|etc|proc|sys|Users)[^\s"',;]*/g;
/* IDs SmartThings (UUID) */
const RE_UUID        = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
/* IDs ADB longs (10+ hex chars) */
const RE_ADB_ID      = /\b[0-9a-f]{10,}\b/gi;
/* Clés de 32+ caractères alphanumériques */
const RE_LONG_KEY    = /\b[A-Za-z0-9]{32,}\b/g;

const VALID_LEVELS = ['info', 'success', 'warning', 'error', 'security'];
const VALID_TYPES  = ['system', 'device', 'media', 'scenario', 'smartthings', 'dlna', 'adb', 'streaming', 'security'];

/* ── maskSensitiveText ───────────────────── */
function maskSensitiveText(text) {
  if (!text || typeof text !== 'string') return text;
  return text
    .replace(RE_TOKEN,        '[token-masqué]')
    .replace(RE_IMEI,         '[imei-masqué]')
    .replace(RE_PHONE,        '[tel-masqué]')
    .replace(RE_SERIAL,       '[série-masqué]')
    .replace(RE_MAC,          '[mac-masqué]')
    .replace(RE_LOCAL_IP,     '[ip-masquée]')
    .replace(RE_ABS_PATH_WIN, '[chemin-masqué]')
    .replace(RE_ABS_PATH_UNIX,'[chemin-masqué]')
    .replace(RE_UUID,         id => `${id.substring(0, 4)}***`)
    .replace(RE_ADB_ID,       '[id-masqué]')
    .replace(RE_LONG_KEY,     '[clé-masquée]');
}

/* ── sanitizeNotificationPayload ─────────── */
function sanitizeNotificationPayload(payload) {
  if (!payload || typeof payload !== 'object') return {};
  const safe = {};
  for (const [k, v] of Object.entries(payload)) {
    const lk = k.toLowerCase();
    /* Bloquer les champs sensibles connus */
    if (['token', 'password', 'secret', 'key', 'imei', 'serial', 'phone', 'mac'].includes(lk)) {
      continue;
    }
    if (typeof v === 'string') {
      safe[k] = maskSensitiveText(v).substring(0, 200);
    } else if (typeof v === 'number' || typeof v === 'boolean') {
      safe[k] = v;
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      safe[k] = sanitizeNotificationPayload(v);
    } else {
      /* Ignorer les types complexes non supportés */
    }
  }
  return safe;
}

/* ── validateNotificationLevel ───────────── */
function validateNotificationLevel(level) {
  if (VALID_LEVELS.includes(level)) return { valid: true, level };
  return { valid: false, reason: `Niveau invalide. Valeurs acceptées : ${VALID_LEVELS.join(', ')}` };
}

/* ── validateNotificationType ────────────── */
function validateNotificationType(type) {
  if (VALID_TYPES.includes(type)) return { valid: true, type };
  return { valid: false, reason: `Type invalide. Valeurs acceptées : ${VALID_TYPES.join(', ')}` };
}

/* ── buildSafeNotification ───────────────── */
function buildSafeNotification(input) {
  const levelCheck = validateNotificationLevel(input.level || 'info');
  const typeCheck  = validateNotificationType(input.type  || 'system');

  const level = levelCheck.valid ? levelCheck.level : 'info';
  const type  = typeCheck.valid  ? typeCheck.type   : 'system';

  const title   = maskSensitiveText(String(input.title   || 'Notification').trim()).substring(0, 100);
  const message = maskSensitiveText(String(input.message || '').trim()).substring(0, 500);
  const meta    = sanitizeNotificationPayload(input.meta || {});

  return {
    level,
    type,
    title,
    message,
    meta,
    sensitiveDataMasked: true,
  };
}

module.exports = {
  maskSensitiveText,
  sanitizeNotificationPayload,
  validateNotificationLevel,
  validateNotificationType,
  buildSafeNotification,
  VALID_LEVELS,
  VALID_TYPES,
};

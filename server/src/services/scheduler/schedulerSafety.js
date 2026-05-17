'use strict';
/* =============================================
   schedulerSafety.js — Phase 13
   Sécurité centrale du scheduler local.
   Actions sensibles bloquées par défaut.
   Local uniquement — jamais de service cloud.
============================================= */

const ALLOW_SENSITIVE = process.env.SCHEDULER_ALLOW_SENSITIVE_ACTIONS === 'true';

/* ── Actions bloquées absolument ─────────── */
const BLOCKED_ACTIONS = [
  'smartthings.scene.execute',
  'smartthings.tv.command',
  'streaming.play',
  'file.delete',
  'file.move',
  'adb.pull',
  'adb.push',
  'network.aggressiveScan',
];

/* ── Actions autorisées ───────────────────── */
const ALLOWED_ACTIONS = [
  'system.healthCheck',
  'devices.refreshStatus',
  'dlna.discover',
  'adb.readOnlyDiagnostics',
  'media.scanLibrary',
  'notifications.cleanup',
  'notifications.summary',
  'observability.snapshot',
  'scenarios.preview',
  'integrations.statusCheck',
  'streaming.libraryStatus',
];

const VALID_SCHEDULE_TYPES = ['interval', 'daily', 'weekly', 'manual'];
const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

/* ── blockSensitiveAction ────────────────── */
function blockSensitiveAction(actionType) {
  if (BLOCKED_ACTIONS.includes(actionType)) {
    return { blocked: true, reason: `Action "${actionType}" bloquée — actions sensibles interdites dans le scheduler.` };
  }
  if (!ALLOWED_ACTIONS.includes(actionType)) {
    return { blocked: true, reason: `Action "${actionType}" inconnue — seules les actions autorisées peuvent être planifiées.` };
  }
  return { blocked: false };
}

/* ── validateActionType ──────────────────── */
function validateActionType(actionType) {
  if (!actionType || typeof actionType !== 'string') {
    return { valid: false, reason: 'actionType manquant.' };
  }
  const block = blockSensitiveAction(actionType);
  if (block.blocked) return { valid: false, reason: block.reason };
  return { valid: true, actionType };
}

/* ── validateScheduleExpression ──────────── */
function validateScheduleExpression(schedule) {
  if (!schedule || typeof schedule !== 'object') {
    return { valid: false, reason: 'Objet schedule manquant.' };
  }
  if (!VALID_SCHEDULE_TYPES.includes(schedule.type)) {
    return { valid: false, reason: `Type de schedule invalide. Valeurs : ${VALID_SCHEDULE_TYPES.join(', ')}` };
  }

  if (schedule.type === 'interval') {
    const min = parseInt(schedule.intervalMinutes, 10);
    if (!min || min < 1 || min > 1440) {
      return { valid: false, reason: 'intervalMinutes doit être entre 1 et 1440.' };
    }
  }

  if (schedule.type === 'daily' || schedule.type === 'weekly') {
    if (!schedule.time || !/^\d{2}:\d{2}$/.test(schedule.time)) {
      return { valid: false, reason: 'time requis au format HH:MM pour daily/weekly.' };
    }
  }

  if (schedule.type === 'weekly') {
    if (!Array.isArray(schedule.daysOfWeek) || schedule.daysOfWeek.length === 0) {
      return { valid: false, reason: 'daysOfWeek requis pour weekly (ex: ["monday","friday"]).' };
    }
    const invalid = schedule.daysOfWeek.filter(d => !DAYS_OF_WEEK.includes(d));
    if (invalid.length > 0) {
      return { valid: false, reason: `Jours invalides : ${invalid.join(', ')}` };
    }
  }

  return { valid: true };
}

/* ── validateScheduleInput ───────────────── */
function validateScheduleInput(input) {
  if (!input || typeof input !== 'object') {
    return { valid: false, reason: 'Corps de requête invalide.' };
  }
  if (!input.name || typeof input.name !== 'string' || !input.name.trim()) {
    return { valid: false, reason: 'Champ "name" requis.' };
  }
  if (input.name.length > 100) {
    return { valid: false, reason: '"name" trop long (100 chars max).' };
  }

  const actionCheck = validateActionType(input.actionType);
  if (!actionCheck.valid) return { valid: false, reason: actionCheck.reason };

  const schedCheck = validateScheduleExpression(input.schedule || { type: 'manual' });
  if (!schedCheck.valid) return { valid: false, reason: schedCheck.reason };

  return { valid: true };
}

/* ── sanitizeSchedulePayload ─────────────── */
function sanitizeSchedulePayload(payload) {
  if (!payload || typeof payload !== 'object') return {};
  const safe = {};
  const BLOCKED_FIELDS = ['token', 'password', 'secret', 'key', 'imei', 'phone', 'serial'];
  for (const [k, v] of Object.entries(payload)) {
    if (BLOCKED_FIELDS.includes(k.toLowerCase())) continue;
    if (typeof v === 'string')  safe[k] = v.substring(0, 200);
    else if (typeof v === 'number' || typeof v === 'boolean') safe[k] = v;
    else if (Array.isArray(v))  safe[k] = v.slice(0, 20).map(e => typeof e === 'string' ? e.substring(0, 50) : e);
  }
  return safe;
}

/* ── buildSafeScheduleError ──────────────── */
function buildSafeScheduleError(error) {
  if (!error) return { message: 'Erreur scheduler inconnue.' };
  const msg = (error.message || String(error)).substring(0, 200);
  return { message: msg, ...(error.code ? { code: error.code } : {}) };
}

module.exports = {
  validateScheduleInput,
  validateActionType,
  validateScheduleExpression,
  blockSensitiveAction,
  sanitizeSchedulePayload,
  buildSafeScheduleError,
  ALLOWED_ACTIONS,
  BLOCKED_ACTIONS,
  VALID_SCHEDULE_TYPES,
};

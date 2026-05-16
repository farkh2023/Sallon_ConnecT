'use strict';
/* =============================================
   schedulerEngine.js — Phase 13
   Moteur de tâches planifiées locales.
   Tick-based — pas de dépendance cron système.
   Jamais d'action sensible automatique.
============================================= */

const store   = require('./schedulerStore');
const safety  = require('./schedulerSafety');
const actions = require('./schedulerActions');
const notif   = require('../notifications/notificationEngine');

const ENABLED     = process.env.SCHEDULER_ENABLED    !== 'false';
const TICK_MS     = parseInt(process.env.SCHEDULER_TICK_MS    || '30000', 10);
const AUTO_START  = process.env.SCHEDULER_AUTO_START !== 'false';
const NOTIFY_OK   = process.env.SCHEDULER_NOTIFY_ON_SUCCESS !== 'false';
const NOTIFY_FAIL = process.env.SCHEDULER_NOTIFY_ON_FAILURE !== 'false';

let _interval   = null;
let _running    = false;
let _startedAt  = null;
let _tickCount  = 0;
const _inFlight = new Set(); // scheduleIds en cours d'exécution (anti-doublon)

/* ── computeNextRun ──────────────────────── */
function computeNextRun(sched) {
  if (!sched || !sched.schedule) return null;
  const { type, intervalMinutes, time, daysOfWeek } = sched.schedule;
  const now = new Date();

  if (type === 'manual') return null;

  if (type === 'interval') {
    const min = parseInt(intervalMinutes || '30', 10);
    if (sched.lastRunAt) {
      return new Date(new Date(sched.lastRunAt).getTime() + min * 60 * 1000).toISOString();
    }
    return new Date(now.getTime() + min * 60 * 1000).toISOString();
  }

  if (type === 'daily' && time) {
    const [hh, mm] = time.split(':').map(Number);
    const next = new Date(now);
    next.setHours(hh, mm, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    return next.toISOString();
  }

  if (type === 'weekly' && time && Array.isArray(daysOfWeek)) {
    const dayMap = { sunday:0, monday:1, tuesday:2, wednesday:3, thursday:4, friday:5, saturday:6 };
    const [hh, mm] = time.split(':').map(Number);
    const targetDays = daysOfWeek.map(d => dayMap[d]).filter(d => d !== undefined).sort();
    if (!targetDays.length) return null;

    for (let offset = 0; offset <= 7; offset++) {
      const candidate = new Date(now);
      candidate.setDate(now.getDate() + offset);
      candidate.setHours(hh, mm, 0, 0);
      if (candidate > now && targetDays.includes(candidate.getDay())) {
        return candidate.toISOString();
      }
    }
  }

  return null;
}

/* ── isDue ───────────────────────────────── */
function isDue(sched) {
  if (!sched.enabled) return false;
  if (sched.schedule && sched.schedule.type === 'manual') return false;
  if (!sched.nextRunAt) return false;
  return new Date(sched.nextRunAt) <= new Date();
}

/* ── runSchedule ─────────────────────────── */
async function runSchedule(scheduleId, options = {}) {
  const sched = store.getScheduleById(scheduleId);
  if (!sched) return { success: false, reason: `Tâche "${scheduleId}" introuvable.` };

  /* Sécurité : vérifier l'action */
  const block = safety.blockSensitiveAction(sched.actionType);
  if (block.blocked) {
    notif.notify({ type: 'system', level: 'warning',
      title: 'Tâche bloquée par sécurité',
      message: block.reason,
      meta: { scheduleId, actionType: sched.actionType },
    });
    return { success: false, reason: block.reason };
  }

  /* Anti-doublon */
  if (_inFlight.has(scheduleId)) {
    return { success: false, reason: 'Tâche déjà en cours d\'exécution.' };
  }
  _inFlight.add(scheduleId);

  const entry = store.createHistoryEntry(scheduleId, sched.name, sched.actionType);

  let result, status, message;
  try {
    result  = await actions.executeAction(sched.actionType);
    status  = (result.status === 'error' || result.status === 'failed') ? 'failed' : 'success';
    message = result.message || JSON.stringify(result).substring(0, 200);
  } catch (err) {
    status  = 'failed';
    message = err.message || 'Erreur inattendue.';
    result  = { status: 'error', message };
  } finally {
    _inFlight.delete(scheduleId);
  }

  /* Notification */
  let notifId = null;
  if (status === 'success' && NOTIFY_OK) {
    const n = notif.notify({ type: 'system', level: 'success',
      title: `Tâche réussie : ${sched.name}`,
      message: message.substring(0, 200),
      meta: { scheduleId, actionType: sched.actionType },
    });
    notifId = n ? n.id : null;
  } else if (status === 'failed' && NOTIFY_FAIL) {
    const n = notif.notify({ type: 'system', level: 'warning',
      title: `Tâche échouée : ${sched.name}`,
      message: message.substring(0, 200),
      meta: { scheduleId, actionType: sched.actionType },
    });
    notifId = n ? n.id : null;
  }

  /* Historique */
  const run = store.finalizeHistoryEntry(entry, status, message, notifId);

  /* Mettre à jour lastRunAt + nextRunAt */
  store.updateSchedule(scheduleId, {
    lastRunAt: run.finishedAt,
    nextRunAt: computeNextRun(sched),
  });

  return { success: status === 'success', status, message, durationMs: run.durationMs, result };
}

/* ── runDueSchedules ─────────────────────── */
async function runDueSchedules() {
  const schedules = store.listSchedules({ enabled: true });
  const due = schedules.filter(isDue);

  for (const sched of due) {
    await runSchedule(sched.id, { auto: true });
  }

  return { checked: schedules.length, due: due.length };
}

/* ── tick ────────────────────────────────── */
async function tick() {
  _tickCount++;
  await runDueSchedules();
}

/* ── createDefaultSchedules ──────────────── */
function createDefaultSchedules() {
  const existing = store.loadSchedules();
  if (existing.length > 0) return; // Ne pas recréer si déjà initialisé

  const defaults = [
    {
      name: 'Health check local',
      description: 'Vérifie l\'état général du système Sallon-ConnecT',
      actionType: 'system.healthCheck',
      enabled: true,
      schedule: { type: 'interval', intervalMinutes: 30 },
    },
    {
      name: 'Résumé notifications',
      description: 'Génère un résumé quotidien des notifications',
      actionType: 'notifications.summary',
      enabled: false,
      schedule: { type: 'daily', time: '20:00' },
    },
    {
      name: 'Nettoyage notifications',
      description: 'Supprime les notifications de plus de 30 jours',
      actionType: 'notifications.cleanup',
      enabled: false,
      schedule: { type: 'daily', time: '23:00' },
    },
    {
      name: 'Statut intégrations',
      description: 'Vérifie l\'état de toutes les intégrations (ADB, DLNA, SmartThings, Streaming)',
      actionType: 'integrations.statusCheck',
      enabled: false,
      schedule: { type: 'interval', intervalMinutes: 60 },
    },
    {
      name: 'Diagnostic appareils',
      description: 'Rafraîchit la liste des appareils configurés',
      actionType: 'devices.refreshStatus',
      enabled: false,
      schedule: { type: 'interval', intervalMinutes: 30 },
    },
  ];

  for (const d of defaults) {
    const sched = store.createSchedule(d);
    store.updateSchedule(sched.id, { nextRunAt: computeNextRun(sched) });
  }
}

/* ── notifyScheduleResult ────────────────── */
function notifyScheduleResult(result) {
  /* Géré directement dans runSchedule */
  return result;
}

/* ── startScheduler ──────────────────────── */
function startScheduler() {
  if (!ENABLED) return { status: 'disabled', message: 'Scheduler désactivé (SCHEDULER_ENABLED=false).' };
  if (_running) return { status: 'already_running', message: 'Scheduler déjà démarré.' };

  createDefaultSchedules();

  _interval  = setInterval(tick, TICK_MS);
  _running   = true;
  _startedAt = new Date().toISOString();

  notif.notify({ type: 'system', level: 'success',
    title: 'Scheduler démarré',
    message: `Moteur de tâches planifiées actif — tick toutes les ${TICK_MS / 1000}s`,
    meta: { tickMs: TICK_MS },
  });

  return { status: 'started', startedAt: _startedAt, tickMs: TICK_MS };
}

/* ── stopScheduler ───────────────────────── */
function stopScheduler() {
  if (!_running) return { status: 'not_running' };
  clearInterval(_interval);
  _interval = null;
  _running  = false;

  notif.notify({ type: 'system', level: 'info',
    title: 'Scheduler arrêté',
    message: 'Moteur de tâches planifiées arrêté',
  });

  return { status: 'stopped' };
}

/* ── getSchedulerStatus ──────────────────── */
function getSchedulerStatus() {
  const schedules  = store.loadSchedules();
  const enabled    = schedules.filter(s => s.enabled);
  const nextSched  = enabled
    .filter(s => s.nextRunAt)
    .sort((a, b) => new Date(a.nextRunAt) - new Date(b.nextRunAt))[0];

  return {
    status:        _running ? 'running' : 'stopped',
    enabled:       ENABLED,
    startedAt:     _startedAt,
    tickMs:        TICK_MS,
    tickCount:     _tickCount,
    autoStart:     AUTO_START,
    totalSchedules:  schedules.length,
    activeSchedules: enabled.length,
    inFlight:        _inFlight.size,
    nextScheduled:   nextSched ? { name: nextSched.name, at: nextSched.nextRunAt } : null,
  };
}

/* Auto-start si configuré */
if (ENABLED && AUTO_START) {
  /* Démarrage différé pour laisser le serveur s'initialiser */
  setTimeout(startScheduler, 2000);
}

module.exports = {
  startScheduler,
  stopScheduler,
  getSchedulerStatus,
  tick,
  computeNextRun,
  runSchedule,
  runDueSchedules,
  createDefaultSchedules,
  notifyScheduleResult,
};

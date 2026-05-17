'use strict';
/* =============================================
   scheduler.js — Phase 13
   Routes du moteur de tâches planifiées.
   Actions sensibles bloquées. Local uniquement.
============================================= */

const express = require('express');
const router  = express.Router();
const engine  = require('../services/scheduler/schedulerEngine');
const store   = require('../services/scheduler/schedulerStore');
const safety  = require('../services/scheduler/schedulerSafety');
const notif   = require('../services/notifications/notificationEngine');

/* ── GET /api/scheduler/safety (statique) ── */
router.get('/safety', (_req, res) => {
  res.json({
    localOnly:              true,
    sensitiveActionsAllowed: process.env.SCHEDULER_ALLOW_SENSITIVE_ACTIONS === 'true',
    allowedActions:          safety.ALLOWED_ACTIONS,
    blockedActions:          safety.BLOCKED_ACTIONS,
    tickMs:                  parseInt(process.env.SCHEDULER_TICK_MS    || '30000', 10),
    maxHistory:              parseInt(process.env.SCHEDULER_MAX_HISTORY || '200', 10),
    notificationsEnabled:    process.env.SCHEDULER_NOTIFY_ON_SUCCESS !== 'false',
    autoStart:               process.env.SCHEDULER_AUTO_START !== 'false',
    externalServices:        false,
    cloudServices:           false,
  });
});

/* ── GET /api/scheduler/actions (statique) ── */
router.get('/actions', (_req, res) => {
  res.json({
    allowed: safety.ALLOWED_ACTIONS.map(a => ({
      actionType: a,
      safe: true,
      description: _actionDesc(a),
    })),
    blocked: safety.BLOCKED_ACTIONS.map(a => ({
      actionType: a,
      safe: false,
      reason: 'Action sensible — bloquée par défaut',
    })),
  });
});

/* ── GET /api/scheduler/status (statique) ── */
router.get('/status', (_req, res) => {
  res.json(engine.getSchedulerStatus());
});

/* ── GET /api/scheduler/history (statique) ── */
router.get('/history', (req, res) => {
  const limit = parseInt(req.query.limit || '50', 10);
  const history = store.getHistory(limit);
  res.json({ status: 'ok', count: history.length, history });
});

/* ── DELETE /api/scheduler/history ────────── */
router.delete('/history', (_req, res) => {
  const result = store.clearHistory();
  notif.notify({ type: 'system', level: 'info',
    title: 'Historique scheduler vidé',
    message: `${result.cleared} entrée(s) supprimée(s)`,
  });
  res.json({ success: true, ...result });
});

/* ── GET /api/scheduler/schedules ──────────── */
router.get('/schedules', (_req, res) => {
  const items = store.listSchedules();
  res.json({ status: 'ok', count: items.length, schedules: items });
});

/* ── POST /api/scheduler/schedules ─────────── */
router.post('/schedules', (req, res) => {
  const check = safety.validateScheduleInput(req.body || {});
  if (!check.valid) return res.status(400).json({ error: check.reason });

  const sched = store.createSchedule(req.body);
  const next  = engine.computeNextRun(sched);
  store.updateSchedule(sched.id, { nextRunAt: next });

  res.status(201).json({ success: true, schedule: { ...sched, nextRunAt: next } });
});

/* ── GET /api/scheduler/schedules/:id ──────── */
router.get('/schedules/:id', (req, res) => {
  const sched = store.getScheduleById(req.params.id);
  if (!sched) return res.status(404).json({ error: 'Tâche introuvable.' });
  res.json(sched);
});

/* ── PATCH /api/scheduler/schedules/:id ────── */
router.patch('/schedules/:id', (req, res) => {
  const { name, description, enabled, schedule } = req.body || {};
  const patch = {};
  if (name        !== undefined) patch.name        = String(name).substring(0, 100);
  if (description !== undefined) patch.description = String(description).substring(0, 300);
  if (enabled     !== undefined) patch.enabled     = Boolean(enabled);
  if (schedule    !== undefined) {
    const sc = safety.validateScheduleExpression(schedule);
    if (!sc.valid) return res.status(400).json({ error: sc.reason });
    patch.schedule = schedule;
  }

  const updated = store.updateSchedule(req.params.id, patch);
  if (!updated) return res.status(404).json({ error: 'Tâche introuvable.' });

  if (patch.schedule) {
    const next = engine.computeNextRun(updated);
    store.updateSchedule(req.params.id, { nextRunAt: next });
    updated.nextRunAt = next;
  }

  res.json({ success: true, schedule: updated });
});

/* ── PATCH /api/scheduler/schedules/:id/enable ─ */
router.patch('/schedules/:id/enable', (req, res) => {
  const updated = store.updateSchedule(req.params.id, { enabled: true });
  if (!updated) return res.status(404).json({ error: 'Tâche introuvable.' });
  const next = engine.computeNextRun(updated);
  store.updateSchedule(req.params.id, { nextRunAt: next });
  res.json({ success: true, id: req.params.id, enabled: true, nextRunAt: next });
});

/* ── PATCH /api/scheduler/schedules/:id/disable ─ */
router.patch('/schedules/:id/disable', (req, res) => {
  const updated = store.updateSchedule(req.params.id, { enabled: false });
  if (!updated) return res.status(404).json({ error: 'Tâche introuvable.' });
  res.json({ success: true, id: req.params.id, enabled: false });
});

/* ── POST /api/scheduler/schedules/:id/run ─── */
router.post('/schedules/:id/run', async (req, res) => {
  const sched = store.getScheduleById(req.params.id);
  if (!sched) return res.status(404).json({ error: 'Tâche introuvable.' });

  const block = safety.blockSensitiveAction(sched.actionType);
  if (block.blocked) {
    notif.notify({ type: 'system', level: 'warning',
      title: 'Exécution manuelle bloquée',
      message: block.reason,
      meta: { scheduleId: sched.id, actionType: sched.actionType },
    });
    return res.status(403).json({ success: false, error: block.reason });
  }

  try {
    const result = await engine.runSchedule(sched.id, { manual: true });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Erreur exécution.' });
  }
});

/* ── DELETE /api/scheduler/schedules/:id ──── */
router.delete('/schedules/:id', (req, res) => {
  const ok = store.deleteSchedule(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Tâche introuvable.' });
  res.json({ success: true, deleted: req.params.id });
});

/* ── Helper descriptions ─────────────────── */
function _actionDesc(a) {
  const map = {
    'system.healthCheck':       'Vérifie l\'état général du serveur',
    'devices.refreshStatus':    'Rafraîchit la liste des appareils configurés',
    'dlna.discover':            'Lance une découverte DLNA/UPnP',
    'adb.readOnlyDiagnostics':  'Diagnostic ADB en lecture seule',
    'media.scanLibrary':        'Scan de la médiathèque locale autorisée',
    'notifications.cleanup':    'Nettoie les notifications anciennes',
    'notifications.summary':    'Résumé périodique des notifications',
    'observability.snapshot':   'Capture un resume observability local et non sensible',
    'scenarios.preview':        'Aperçu des scénarios disponibles',
    'integrations.statusCheck': 'Vérifie l\'état de toutes les intégrations',
    'streaming.libraryStatus':  'Statut de la médiathèque streaming',
  };
  return map[a] || a;
}

module.exports = router;

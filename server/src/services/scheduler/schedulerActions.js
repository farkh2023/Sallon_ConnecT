'use strict';
/* =============================================
   schedulerActions.js — Phase 13
   Implémentation des actions autorisées.
   Jamais d'action sensible (scène, TV, streaming.play...).
   Jamais de scan Internet.
   Jamais de modification de fichier personnel.
============================================= */

const config  = require('../config');
const notifStore = require('../notifications/notificationStore');

/* Imports lazy pour éviter les dépendances circulaires */
function getDlna()    { return require('../media/dlnaConnector'); }
function getAdb()     { return require('../media/adbConnector'); }
function getLibrary() { return require('../media/localMediaLibrary'); }
function getRegistry(){ return require('../scenarios/scenarioRegistry'); }

/* ── system.healthCheck ──────────────────── */
async function healthCheck() {
  return {
    status:    'ok',
    timestamp: new Date().toISOString(),
    uptime:    Math.round(process.uptime()),
    memory:    `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} Mo`,
    phase:     13,
  };
}

/* ── devices.refreshStatus ───────────────── */
async function devicesRefreshStatus() {
  /* Rafraîchit la liste depuis devices.json sans scan réseau agressif */
  try {
    const fs   = require('fs');
    const path = require('path');
    const filePath = path.resolve('data/devices.json');
    const devices  = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return {
      status:      'ok',
      deviceCount: devices.length,
      message:     `${devices.length} appareil(s) configuré(s) — statut réseau non vérifié (scan non agressif)`,
      source:      'devices.json',
    };
  } catch (err) {
    return { status: 'error', message: 'Impossible de lire devices.json', code: err.code };
  }
}

/* ── dlna.discover ───────────────────────── */
async function dlnaDiscover() {
  if (!config.dlna || !config.dlna.enabled) {
    return { status: 'skipped', message: 'DLNA désactivé (DLNA_ENABLED=false).' };
  }
  try {
    const result = await getDlna().discoverDevices();
    return {
      status:      result.status,
      deviceCount: result.count || 0,
      message:     `${result.count || 0} appareil(s) DLNA découvert(s)`,
    };
  } catch (err) {
    return { status: 'error', message: err.message || 'Erreur DLNA discover.' };
  }
}

/* ── adb.readOnlyDiagnostics ─────────────── */
async function adbReadOnlyDiagnostics() {
  if (!config.adb || !config.adb.enabled) {
    return { status: 'skipped', message: 'ADB désactivé (ADB_ENABLED=false).' };
  }
  if (!config.adb.readOnly) {
    return { status: 'skipped', message: 'ADB non-readOnly — diagnostic ignoré par sécurité.' };
  }
  try {
    const adb    = getAdb();
    const status = await adb.getStatus();
    return {
      status:  status.status || 'ok',
      message: `ADB statut : ${status.status || 'inconnu'}`,
      adbEnabled: config.adb.enabled,
      readOnly:   config.adb.readOnly,
    };
  } catch (err) {
    return { status: 'error', message: err.message || 'Erreur ADB diagnostics.' };
  }
}

/* ── media.scanLibrary ───────────────────── */
async function mediaScanLibrary() {
  if (!config.streaming || !config.streaming.enabled) {
    return { status: 'skipped', message: 'Streaming désactivé (MEDIA_STREAMING_ENABLED=false).' };
  }
  if (!config.streaming.allowedDir) {
    return { status: 'skipped', message: 'MEDIA_STREAMING_ALLOWED_DIR non configuré.' };
  }
  try {
    const result = getLibrary().scanAllowedDirectory();
    return {
      status:    result.status,
      itemCount: result.itemCount || 0,
      message:   `${result.itemCount || 0} média(s) dans la médiathèque`,
    };
  } catch (err) {
    return { status: 'error', message: err.message || 'Erreur scan médiathèque.' };
  }
}

/* ── notifications.cleanup ───────────────── */
async function notificationsCleanup() {
  try {
    const all = notifStore.loadNotifications();
    const days = parseInt(process.env.NOTIFICATIONS_AUTO_CLEANUP_DAYS || '30', 10);
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const kept   = all.filter(n => new Date(n.createdAt).getTime() > cutoff);
    const removed = all.length - kept.length;
    notifStore.saveNotifications(kept);
    return {
      status:  'ok',
      removed,
      kept:    kept.length,
      message: `${removed} notification(s) ancienne(s) supprimée(s) (>${days} jours)`,
    };
  } catch (err) {
    return { status: 'error', message: err.message || 'Erreur nettoyage notifications.' };
  }
}

/* ── notifications.summary ───────────────── */
async function notificationsSummary() {
  try {
    const stats = notifStore.getNotificationStats();
    return {
      status:  'ok',
      message: `${stats.total} notification(s) — ${stats.unread} non lue(s)`,
      summary: {
        total:    stats.total,
        unread:   stats.unread,
        byType:   stats.byType  || {},
        byLevel:  stats.byLevel || {},
        lastAt:   stats.lastNotificationAt,
      },
    };
  } catch (err) {
    return { status: 'error', message: err.message || 'Erreur résumé notifications.' };
  }
}

/* ── integrations.statusCheck ────────────── */
async function integrationsStatusCheck() {
  const results = {};

  results.adb = {
    enabled:  !!(config.adb && config.adb.enabled),
    readOnly: !!(config.adb && config.adb.readOnly),
  };
  results.dlna = {
    enabled:          !!(config.dlna && config.dlna.enabled),
    streamingEnabled: !!(config.dlna && config.dlna.streamingEnabled),
  };
  results.smartthings = {
    enabled:    !!(config.smartThings && config.smartThings.enabled),
    hasToken:   !!(config.smartThings && config.smartThings.token),
    readOnly:   !!(config.smartThings && config.smartThings.readOnly),
  };
  results.streaming = {
    enabled:    !!(config.streaming && config.streaming.enabled),
    hasDir:     !!(config.streaming && config.streaming.allowedDir),
  };
  results.notifications = {
    enabled: !!(config.notifications && config.notifications.enabled),
  };

  const activeCount = Object.values(results).filter(r => r.enabled).length;

  return {
    status:      'ok',
    activeCount,
    message:     `${activeCount} intégration(s) active(s) sur 5`,
    integrations: results,
  };
}

/* ── scenarios.preview ───────────────────── */
async function scenariosPreview() {
  try {
    const registry = getRegistry();
    const scenarios = registry.getAll();
    return {
      status:        'ok',
      scenarioCount: scenarios.length,
      message:       `${scenarios.length} scénario(s) disponible(s) — aperçu uniquement, aucune exécution`,
      scenarios:     scenarios.map(s => ({ id: s.id, name: s.name, stepCount: s.steps ? s.steps.length : 0 })),
    };
  } catch (err) {
    return { status: 'error', message: err.message || 'Erreur aperçu scénarios.' };
  }
}

/* ── streaming.libraryStatus ─────────────── */
async function streamingLibraryStatus() {
  try {
    const status = getLibrary().getLibraryStatus();
    return {
      status:     status.status,
      itemCount:  status.itemCount || 0,
      message:    `Médiathèque : ${status.status} — ${status.itemCount || 0} élément(s)`,
      lastScanAt: status.lastScanAt || null,
    };
  } catch (err) {
    return { status: 'error', message: err.message || 'Erreur statut médiathèque.' };
  }
}

/* ── Dispatch ─────────────────────────────── */
const ACTION_MAP = {
  'system.healthCheck':       healthCheck,
  'devices.refreshStatus':    devicesRefreshStatus,
  'dlna.discover':            dlnaDiscover,
  'adb.readOnlyDiagnostics':  adbReadOnlyDiagnostics,
  'media.scanLibrary':        mediaScanLibrary,
  'notifications.cleanup':    notificationsCleanup,
  'notifications.summary':    notificationsSummary,
  'integrations.statusCheck': integrationsStatusCheck,
  'scenarios.preview':        scenariosPreview,
  'streaming.libraryStatus':  streamingLibraryStatus,
};

async function executeAction(actionType) {
  const fn = ACTION_MAP[actionType];
  if (!fn) {
    return { status: 'error', message: `Action "${actionType}" non implémentée.` };
  }
  return fn();
}

module.exports = {
  executeAction,
  ACTION_MAP,
};

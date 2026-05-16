'use strict';
/* =============================================
   adbConnector.js — Phase 6 : connecteur ADB complet, lecture seule
   Toutes les commandes passent par adbSafety.validateAdbCommand().
   ADB_ENABLED=false par défaut.
   ADB_READ_ONLY=true obligatoire.
   ADB_MASK_DEVICE_ID=true masque les IDs dans toutes les réponses.
============================================= */

const { exec }  = require('child_process');
const config    = require('../config');
const safety    = require('./adbSafety');

/* ── Helpers internes ──────────────────────── */

function isMasking() {
  return process.env.ADB_MASK_DEVICE_ID !== 'false';
}

function getTimeout() {
  return config.adb.commandTimeout || 5000;
}

/* Exécute une commande ADB après validation par adbSafety */
function runSafeAdbCommand(args) {
  return new Promise((resolve, reject) => {
    const validation = safety.validateAdbCommand(args);
    if (!validation.valid) {
      return reject(new Error(validation.reason));
    }

    const adbPath   = config.adb.path || 'adb';
    const deviceArg = config.adb.deviceId ? `-s ${config.adb.deviceId} ` : '';
    const cmd       = `"${adbPath}" ${deviceArg}${args}`;

    exec(cmd, { timeout: getTimeout() }, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(safety.buildSafeError(err).message));
      }
      resolve(safety.sanitizeAdbOutput(stdout.trim()));
    });
  });
}

/* Vérifie si adb est installé */
function isAdbAvailable() {
  return new Promise(resolve => {
    const adbPath = config.adb.path || 'adb';
    exec(`"${adbPath}" version`, { timeout: 3000 }, err => resolve(!err));
  });
}

/* ── getStatus() — retourne un objet structuré ── */
async function getStatus() {
  if (!config.adb.enabled) {
    return {
      status:    'disabled',
      readOnly:  true,
      message:   'ADB désactivé. Activez ADB_ENABLED=true dans .env',
      available: false,
    };
  }

  const available = await isAdbAvailable();
  if (!available) {
    return {
      status:    'unavailable',
      readOnly:  true,
      message:   'ADB introuvable. Vérifiez ADB_PATH dans .env ou installez Android Platform Tools.',
      available: false,
    };
  }

  /* Vérifier les appareils connectés */
  try {
    const output = await runSafeAdbCommand('devices');
    const lines  = output.split('\n').slice(1).filter(l => l.trim());

    if (!lines.length) {
      return { status: 'no_device', readOnly: true, message: 'Aucun appareil Android détecté.', available: false };
    }

    const hasUnauthorized = lines.some(l => l.includes('unauthorized'));
    const hasOnline       = lines.some(l => l.includes('\tdevice'));

    if (!hasOnline && hasUnauthorized) {
      return { status: 'unauthorized', readOnly: true, message: 'Appareil détecté mais non autorisé. Acceptez la connexion sur le téléphone.', available: false };
    }

    return {
      status:        'available',
      readOnly:       true,
      message:       'Appareil Android connecté et autorisé.',
      available:      true,
      deviceCount:   lines.filter(l => l.includes('\tdevice')).length,
      lastCheckedAt: new Date().toISOString(),
    };
  } catch (err) {
    return { status: 'error', readOnly: true, message: safety.buildSafeError(err).message, available: false };
  }
}

/* ── listDevices() ─────────────────────────── */
async function listDevices() {
  if (!config.adb.enabled) return { status: 'disabled', devices: [] };

  const available = await isAdbAvailable();
  if (!available) return { status: 'unavailable', devices: [] };

  try {
    const output  = await runSafeAdbCommand('devices');
    const lines   = output.split('\n').slice(1).filter(l => l.trim());

    const devices = lines.map(line => {
      const parts = line.split('\t');
      const rawId = parts[0] ? parts[0].trim() : '';
      const state = parts[1] ? parts[1].trim() : 'unknown';
      return {
        id:      isMasking() ? safety.maskDeviceId(rawId) : rawId,
        state,
        masked:  isMasking(),
      };
    });

    const unauthorized = devices.some(d => d.state === 'unauthorized');
    if (unauthorized && !devices.some(d => d.state === 'device')) {
      return { status: 'unauthorized', message: 'Acceptez la connexion de débogage sur le téléphone.', devices };
    }

    return { status: 'ok', devices, count: devices.length };
  } catch (err) {
    return { status: 'error', message: safety.buildSafeError(err).message, devices: [] };
  }
}

/* ── getDeviceModel() ──────────────────────── */
async function getDeviceModel() {
  if (!config.adb.enabled) return { status: 'disabled' };

  const available = await isAdbAvailable();
  if (!available) return { status: 'unavailable' };

  try {
    const manufacturer = await runSafeAdbCommand('shell getprop ro.product.manufacturer');
    const model        = await runSafeAdbCommand('shell getprop ro.product.model');
    return { status: 'ok', manufacturer, model };
  } catch (err) {
    return { status: 'unauthorized', message: safety.buildSafeError(err).message };
  }
}

/* ── getAndroidVersion() ───────────────────── */
async function getAndroidVersion() {
  if (!config.adb.enabled) return { status: 'disabled' };

  const available = await isAdbAvailable();
  if (!available) return { status: 'unavailable' };

  try {
    const version = await runSafeAdbCommand('shell getprop ro.build.version.release');
    return { status: 'ok', androidVersion: version };
  } catch (err) {
    return { status: 'unauthorized', message: safety.buildSafeError(err).message };
  }
}

/* ── getBatteryInfo() ──────────────────────── */
async function getBatteryInfo() {
  if (!config.adb.enabled) return { status: 'disabled' };

  const available = await isAdbAvailable();
  if (!available) return { status: 'unavailable' };

  try {
    const raw     = await runSafeAdbCommand('shell dumpsys battery');
    const level   = (raw.match(/level:\s*(\d+)/)   || [])[1];
    const plugged = (raw.match(/plugged:\s*(\d+)/)  || [])[1];
    const health  = (raw.match(/health:\s*(\d+)/)   || [])[1];
    return {
      status:       'ok',
      level:        level   ? parseInt(level, 10) : null,
      plugged:      plugged ? plugged !== '0'     : null,
      health:       health  ? parseInt(health, 10): null,
    };
  } catch (err) {
    return { status: 'unauthorized', message: safety.buildSafeError(err).message };
  }
}

/* ── getStorageInfo() ──────────────────────── */
async function getStorageInfo() {
  if (!config.adb.enabled) return { status: 'disabled' };

  const available = await isAdbAvailable();
  if (!available) return { status: 'unavailable' };

  try {
    const raw   = await runSafeAdbCommand('shell df /sdcard');
    const lines = raw.split('\n').filter(l => l.trim());
    const data  = lines[1] ? lines[1].split(/\s+/) : [];
    return {
      status:      'ok',
      totalKb:     data[1] ? parseInt(data[1], 10) : null,
      usedKb:      data[2] ? parseInt(data[2], 10) : null,
      availKb:     data[3] ? parseInt(data[3], 10) : null,
    };
  } catch (err) {
    return { status: 'unauthorized', message: safety.buildSafeError(err).message };
  }
}

/* ── getMediaSummary() — comptage uniquement ─ */
async function getMediaSummary() {
  if (!config.adb.enabled) return { status: 'disabled' };

  const available = await isAdbAvailable();
  if (!available) return { status: 'unavailable' };

  /* Validation : content query sur MediaStore est dans l'allowlist via préfixe */
  try {
    /* On utilise adb shell df /sdcard comme proxy pour la disponibilité du stockage */
    const storage = await getStorageInfo();
    return {
      status:     'ok',
      note:       'Comptage uniquement — aucun fichier extrait, aucun contenu lu.',
      available:   storage.status === 'ok',
      storageKb:   storage.totalKb,
    };
  } catch (err) {
    return { status: 'error', message: safety.buildSafeError(err).message };
  }
}

/* ── getSafeDiagnostics() — tout en un ─────── */
async function getSafeDiagnostics() {
  if (!config.adb.enabled) {
    return {
      status:   'disabled',
      readOnly: true,
      message:  'ADB désactivé. Activez ADB_ENABLED=true dans .env',
    };
  }

  const st = await getStatus();
  if (st.status !== 'available') return { ...st, readOnly: true };

  const [model, version, battery, storage, media] = await Promise.allSettled([
    getDeviceModel(),
    getAndroidVersion(),
    getBatteryInfo(),
    getStorageInfo(),
    getMediaSummary(),
  ]);

  const pick = r => r.status === 'fulfilled' ? r.value : { status: 'error' };

  return {
    status:       'available',
    readOnly:     true,
    masked:       isMasking(),
    model:        pick(model),
    androidVersion: pick(version),
    battery:      pick(battery),
    storage:      pick(storage),
    mediaSummary: pick(media),
    lastCheckedAt: new Date().toISOString(),
    securityNote: 'Lecture seule — aucun fichier copié, aucune donnée privée lue.',
  };
}

/* ── getCapabilities() ─────────────────────── */
function getCapabilities() {
  if (!config.adb.enabled) return [];
  return ['list-devices', 'get-model', 'get-android-version', 'get-battery', 'get-storage', 'safe-diagnostics'];
}

/* ── runPreview() — compatible Phase 4/5 ─── */
function runPreview() {
  if (!config.adb.enabled) {
    return {
      status:  'disabled',
      message: 'ADB désactivé. Pour activer : ADB_ENABLED=true et ADB_PATH dans .env',
      howTo:   'Installer Android Platform Tools, connecter le Galaxy S23 Ultra en USB, activer le débogage USB.',
    };
  }
  return { status: 'ready', message: 'ADB actif — lecture seule via adbSafety.' };
}

module.exports = {
  getStatus,
  getCapabilities,
  listDevices,
  getDeviceModel,
  getAndroidVersion,
  getBatteryInfo,
  getStorageInfo,
  getMediaSummary,
  getSafeDiagnostics,
  runSafeAdbCommand,
  runPreview,
};

'use strict';
/* =============================================
   smartThingsConnector.js — Phase 8 + 9 + 10
   Phase 8  : lecture seule.
   Phase 9  : exécution de scènes opt-in uniquement.
   Phase 10 : commandes TV opt-in, allowlist stricte.

   RÈGLES ABSOLUES :
   - Token jamais affiché ni loggé
   - Phase 8/9 : aucune commande directe appareil
   - Phase 10  : commandes TV seulement, allowlist + confirmation + audit
   - Jamais contrôler serrure, caméra, alarme, appareil sensible
============================================= */

const https  = require('https');
const fs     = require('fs');
const path   = require('path');
const config = require('../config');
const safety = require('./smartThingsSafety');

/* ── Helper HTTP GET sécurisé ──────────────── */
function stGet(path) {
  return new Promise((resolve, reject) => {
    let headers;
    try {
      headers = safety.buildSmartThingsHeaders(config.smartThings);
    } catch (err) {
      return reject(err);
    }

    const options = {
      hostname: 'api.smartthings.com',
      port:     443,
      path,
      method:   'GET',
      headers,
      timeout:  config.smartThings.commandTimeout || 5000,
    };

    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(body) });
        } catch {
          reject(new Error('Réponse SmartThings non parseable'));
        }
      });
    });

    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout SmartThings')); });
    req.on('error', reject);
    req.end();
  });
}

/* ── Vérification préalable ─────────────────── */
function preflight() {
  if (!config.smartThings.enabled)                     return { blocked: true, status: 'disabled' };
  if (!config.smartThings.token || !config.smartThings.token.trim()) return { blocked: true, status: 'missing_token' };
  if (!config.smartThings.readOnly)                    return { blocked: true, status: 'readonly_violation' };
  return { blocked: false };
}

/* ── Réponse commune quand bloqué ───────────── */
function blockedResponse(status, extra) {
  return {
    status,
    enabled:              config.smartThings.enabled,
    readOnly:             true,
    available:            false,
    tokenConfigured:      !!(config.smartThings.token && config.smartThings.token.trim()),
    locationConfigured:   !!(config.smartThings.defaultLocationId),
    tvConfigured:         !!(config.smartThings.tvDeviceId),
    sceneExecutionAllowed: false,
    masked:               config.smartThings.maskIds,
    lastCheckedAt:        new Date().toISOString(),
    ...extra,
  };
}

/* ── getStatus ──────────────────────────────── */
async function getStatus() {
  const pre = preflight();
  if (pre.blocked) return blockedResponse(pre.status);

  try {
    const res = await stGet('/v1/locations');
    if (res.statusCode === 401) return blockedResponse('unauthorized');
    return blockedResponse('available', { available: true });
  } catch {
    return blockedResponse('unavailable');
  }
}

/* ── getCapabilities ────────────────────────── */
function getCapabilities() {
  const pre = preflight();
  if (pre.blocked) return [];
  return ['list-locations', 'list-devices', 'get-device-status', 'find-samsung-tv', 'list-scenes', 'preview-scene'];
}

/* ── listLocations ──────────────────────────── */
async function listLocations() {
  const pre = preflight();
  if (pre.blocked) return { status: pre.status, locations: [] };

  try {
    const res = await stGet('/v1/locations');
    if (res.statusCode === 401) return { status: 'unauthorized', locations: [], message: 'Token SmartThings invalide ou expiré.' };
    const locations = (res.data.items || []).map(l => safety.sanitizeSmartThingsResponse({
      locationId:  l.locationId,
      name:        l.name,
      countryCode: l.countryCode || null,
    }));
    return { status: 'available', count: locations.length, locations };
  } catch (err) {
    return { status: 'unavailable', locations: [], ...safety.sanitizeSmartThingsError(err) };
  }
}

/* ── listDevices ─────────────────────────────── */
async function listDevices() {
  const pre = preflight();
  if (pre.blocked) return { status: pre.status, devices: [] };

  try {
    const res = await stGet('/v1/devices');
    if (res.statusCode === 401) return { status: 'unauthorized', devices: [], message: 'Token SmartThings invalide ou expiré.' };
    const devices = (res.data.items || []).map(d => safety.sanitizeSmartThingsResponse({
      deviceId:     d.deviceId,
      name:         d.name,
      label:        d.label,
      type:         d.type,
      locationId:   d.locationId,
      roomId:       d.roomId,
      manufacturer: d.ocf?.mnmn || null,
      model:        d.ocf?.mn   || null,
    }));
    return { status: 'available', count: devices.length, devices };
  } catch (err) {
    return { status: 'unavailable', devices: [], ...safety.sanitizeSmartThingsError(err) };
  }
}

/* ── getDevice ──────────────────────────────── */
async function getDevice(deviceId) {
  const pre = preflight();
  if (pre.blocked) return { status: pre.status };
  if (!deviceId) return { status: 'error', message: 'deviceId requis' };

  const maskedId = safety.maskSmartThingsId(deviceId);
  try {
    const res = await stGet(`/v1/devices/${deviceId}`);
    if (res.statusCode === 401) return { status: 'unauthorized', deviceId: maskedId, message: 'Token invalide.' };
    if (res.statusCode === 404) return { status: 'not_found',    deviceId: maskedId, message: 'Appareil introuvable.' };
    return {
      status: 'available',
      device: safety.sanitizeSmartThingsResponse({
        deviceId:   res.data.deviceId,
        name:       res.data.name,
        label:      res.data.label,
        type:       res.data.type,
        locationId: res.data.locationId,
        roomId:     res.data.roomId,
      }),
    };
  } catch (err) {
    return { status: 'unavailable', deviceId: maskedId, ...safety.sanitizeSmartThingsError(err) };
  }
}

/* ── getDeviceStatus ────────────────────────── */
async function getDeviceStatus(deviceId) {
  const pre = preflight();
  if (pre.blocked) return { status: pre.status };
  if (!deviceId) return { status: 'error', message: 'deviceId requis' };

  const maskedId = safety.maskSmartThingsId(deviceId);
  try {
    const res = await stGet(`/v1/devices/${deviceId}/status`);
    if (res.statusCode === 401) return { status: 'unauthorized', deviceId: maskedId, message: 'Token invalide.' };
    if (res.statusCode === 404) return { status: 'not_found',    deviceId: maskedId, message: 'Appareil introuvable.' };

    // Extrait seulement les valeurs/unités — jamais de champ sensible
    const components = res.data.components || {};
    const sanitized  = {};
    for (const [compKey, compVal] of Object.entries(components)) {
      sanitized[compKey] = {};
      for (const [capKey, capVal] of Object.entries(compVal || {})) {
        sanitized[compKey][capKey] = {};
        for (const [attrKey, attrVal] of Object.entries(capVal || {})) {
          sanitized[compKey][capKey][attrKey] = {
            value: attrVal?.value ?? null,
            unit:  attrVal?.unit  ?? null,
          };
        }
      }
    }

    return { status: 'available', deviceId: maskedId, components: sanitized, readOnly: true };
  } catch (err) {
    return { status: 'unavailable', deviceId: maskedId, ...safety.sanitizeSmartThingsError(err) };
  }
}

/* ── findSamsungTv ──────────────────────────── */
async function findSamsungTv() {
  const pre = preflight();
  if (pre.blocked) return { status: pre.status, tv: null };

  // Priorité : ID configuré
  if (config.smartThings.tvDeviceId) {
    try {
      const res = await stGet(`/v1/devices/${config.smartThings.tvDeviceId}`);
      if (res.statusCode === 401) return { status: 'unauthorized', tv: null };
      if (res.statusCode === 404) return { status: 'not_found', tv: null, message: 'TV configurée introuvable dans SmartThings.' };
      const d = res.data;
      return {
        status: 'found',
        tv: safety.sanitizeSmartThingsResponse({
          deviceId:   d.deviceId,
          name:       d.name,
          label:      d.label,
          locationId: d.locationId,
          type:       d.type,
        }),
        source: 'configured',
        note:   'Lecture seule — aucune commande envoyée à la TV.',
      };
    } catch (err) {
      return { status: 'unavailable', tv: null, ...safety.sanitizeSmartThingsError(err) };
    }
  }

  // Fallback : détection automatique par nom
  try {
    const res = await stGet('/v1/devices');
    if (res.statusCode === 401) return { status: 'unauthorized', tv: null };
    const items   = res.data.items || [];
    const tvMatch = /samsung.*tv|smart.*tv|television|tv\s/i;
    const tv      = items.find(d => tvMatch.test(`${d.name || ''} ${d.label || ''}`));

    if (!tv) {
      return {
        status: 'not_found', tv: null,
        message: 'Aucune TV Samsung détectée. Configurer SMARTTHINGS_TV_DEVICE_ID dans .env.',
      };
    }

    return {
      status: 'found',
      tv: safety.sanitizeSmartThingsResponse({
        deviceId:   tv.deviceId,
        name:       tv.name,
        label:      tv.label,
        locationId: tv.locationId,
        type:       tv.type,
      }),
      source: 'auto-detected',
      note:   'Lecture seule — aucune commande envoyée à la TV.',
    };
  } catch (err) {
    return { status: 'unavailable', tv: null, ...safety.sanitizeSmartThingsError(err) };
  }
}

/* ── getTvStatus ────────────────────────────── */
async function getTvStatus() {
  const pre = preflight();
  if (pre.blocked) return { status: pre.status };
  if (!config.smartThings.tvDeviceId) {
    return { status: 'not_configured', message: 'SMARTTHINGS_TV_DEVICE_ID non configuré dans .env.' };
  }
  return getDeviceStatus(config.smartThings.tvDeviceId);
}

/* ── listScenes ─────────────────────────────── */
async function listScenes() {
  const pre = preflight();
  if (pre.blocked) return { status: pre.status, scenes: [] };

  const locationParam = config.smartThings.defaultLocationId
    ? `?locationId=${config.smartThings.defaultLocationId}`
    : '';

  try {
    const res = await stGet(`/v1/scenes${locationParam}`);
    if (res.statusCode === 401) return { status: 'unauthorized', scenes: [], message: 'Token invalide.' };
    const scenes = (res.data.items || []).map(s => safety.sanitizeSmartThingsResponse({
      sceneId:    s.sceneId,
      sceneName:  s.sceneName,
      locationId: s.locationId,
    }));
    return { status: 'available', count: scenes.length, scenes };
  } catch (err) {
    return { status: 'unavailable', scenes: [], ...safety.sanitizeSmartThingsError(err) };
  }
}

/* ── previewSceneExecution ──────────────────── */
/* SÉCURITÉ : ne jamais appeler POST /scenes/{id}/execute */
async function previewSceneExecution(sceneId) {
  const pre = preflight();
  if (pre.blocked) return { status: pre.status, message: 'Prévisualisation indisponible.' };
  if (!sceneId) return { status: 'error', message: 'sceneId requis' };

  const maskedSceneId = safety.maskSmartThingsId(sceneId);

  // Seul GET /scenes est appelé — jamais POST /execute
  try {
    const locationParam = config.smartThings.defaultLocationId
      ? `?locationId=${config.smartThings.defaultLocationId}`
      : '';
    const res = await stGet(`/v1/scenes${locationParam}`);
    let sceneInfo = null;
    if (res.statusCode === 200) {
      sceneInfo = (res.data.items || []).find(s => s.sceneId === sceneId);
    }

    return {
      status:          'preview_only',
      sceneId:         maskedSceneId,
      sceneName:       sceneInfo?.sceneName || 'Scène inconnue',
      actions:         sceneInfo ? 'disponibles via SmartThings' : 'non récupérées',
      message:         'Prévisualisation uniquement — aucune scène exécutée',
      securityWarning: 'Exécution désactivée (SMARTTHINGS_ALLOW_SCENE_EXECUTION=false)',
      readOnly:        true,
    };
  } catch (err) {
    return {
      status:          'preview_only',
      sceneId:         maskedSceneId,
      message:         'Prévisualisation uniquement — aucune scène exécutée',
      securityWarning: 'Exécution désactivée dans cette phase',
      readOnly:        true,
      ...safety.sanitizeSmartThingsError(err),
    };
  }
}

/* ── getSafeDiagnostics ─────────────────────── */
async function getSafeDiagnostics() {
  const statusResult = await getStatus();
  if (!statusResult.available) return statusResult;

  const [locR, devR, scnR] = await Promise.allSettled([
    listLocations(),
    listDevices(),
    listScenes(),
  ]);

  return {
    status:               'available',
    enabled:              true,
    readOnly:             true,
    tokenConfigured:      true,
    locationConfigured:   !!(config.smartThings.defaultLocationId),
    tvConfigured:         !!(config.smartThings.tvDeviceId),
    sceneExecutionAllowed: false,
    masked:               config.smartThings.maskIds,
    locationCount:        locR.status === 'fulfilled' ? (locR.value.count || 0) : 0,
    deviceCount:          devR.status === 'fulfilled' ? (devR.value.count || 0) : 0,
    sceneCount:           scnR.status === 'fulfilled' ? (scnR.value.count || 0) : 0,
    lastCheckedAt:        new Date().toISOString(),
  };
}

/* ═════════════════════════════════════════════
   PHASE 9 — Exécution contrôlée de scènes
   Chaque exécution requiert :
   1. SMARTTHINGS_ALLOW_SCENE_EXECUTION=true
   2. sceneId dans SMARTTHINGS_SCENE_ALLOWLIST
   3. code de confirmation correct
   4. audit local activé
═════════════════════════════════════════════ */

/* ── Helper HTTP POST (scènes uniquement) ─── */
function stPost(path) {
  return new Promise((resolve, reject) => {
    let headers;
    try {
      headers = safety.buildSmartThingsHeaders(config.smartThings);
    } catch (err) {
      return reject(err);
    }

    const options = {
      hostname: 'api.smartthings.com',
      port:     443,
      path,
      method:   'POST',
      headers:  { ...headers, 'Content-Length': 0 },
      timeout:  config.smartThings.commandTimeout || 5000,
    };

    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        let data = {};
        try { data = body ? JSON.parse(body) : {}; } catch { /* empty body is OK */ }
        resolve({ statusCode: res.statusCode, data });
      });
    });

    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout SmartThings POST')); });
    req.on('error', reject);
    req.end();
  });
}

/* ── Politique d'exécution de scènes ───────── */
function getSceneExecutionPolicy() {
  const allowlist = (config.smartThings.sceneAllowlist || '')
    .split(',').map(s => s.trim()).filter(Boolean);
  return {
    enabled:                 config.smartThings.allowSceneExecution,
    confirmationRequired:    config.smartThings.sceneExecutionRequireConfirmation,
    confirmationCodeHint:    config.smartThings.sceneExecutionRequireConfirmation ? '[code requis]' : '[non requis]',
    allowlistCount:          allowlist.length,
    allowlistConfigured:     allowlist.length > 0,
    auditEnabled:            config.smartThings.sceneAuditEnabled,
    deviceCommandsBlocked:   config.smartThings.blockDeviceCommands,
    sensitiveDevicesBlocked: config.smartThings.blockSensitiveDevices,
    readOnly:                true,
  };
}

/* ── Scènes exécutables (allowlistées) ─────── */
async function getExecutableScenes() {
  const policy   = getSceneExecutionPolicy();
  const allowlist = (config.smartThings.sceneAllowlist || '')
    .split(',').map(s => s.trim()).filter(Boolean);

  if (!policy.enabled) {
    return { status: 'disabled', scenes: [], policy, message: 'Activez SMARTTHINGS_ALLOW_SCENE_EXECUTION=true' };
  }
  if (allowlist.length === 0) {
    return { status: 'no_allowlist', scenes: [], policy, message: 'Configurez SMARTTHINGS_SCENE_ALLOWLIST dans .env' };
  }

  const pre = preflight();
  if (pre.blocked) return { status: pre.status, scenes: [], policy };

  const locationParam = config.smartThings.defaultLocationId
    ? `?locationId=${config.smartThings.defaultLocationId}` : '';

  try {
    const res = await stGet(`/v1/scenes${locationParam}`);
    if (res.statusCode === 401) return { status: 'unauthorized', scenes: [], policy };

    const allScenes = res.data.items || [];
    const executable = allScenes
      .filter(s => allowlist.includes(s.sceneId))
      .map(s => ({
        sceneId:              s.sceneId,                              // ID complet — nécessaire pour l'exécution
        sceneIdDisplay:       safety.maskSmartThingsId(s.sceneId),   // Masqué — pour l'affichage uniquement
        sceneName:            s.sceneName,
        locationId:           safety.maskSmartThingsId(s.locationId),
        executable:           true,
        requiresConfirmation: config.smartThings.sceneExecutionRequireConfirmation,
      }));

    return { status: 'available', count: executable.length, scenes: executable, policy };
  } catch (err) {
    return { status: 'unavailable', scenes: [], policy, ...safety.sanitizeSmartThingsError(err) };
  }
}

/* ── Validation avant exécution ─────────────── */
async function validateSceneBeforeExecution(sceneId, options = {}) {
  // 1. Vérification activation
  const execCheck = safety.validateSceneExecutionEnabled(config.smartThings);
  if (!execCheck.valid) return { valid: false, reason: execCheck.reason };

  // 2. Vérification allowlist
  const allowCheck = safety.validateSceneInAllowlist(sceneId, config.smartThings);
  if (!allowCheck.valid) return { valid: false, reason: allowCheck.reason };

  // 3. Vérification code de confirmation
  const confirmCheck = safety.validateConfirmationCode(options.confirmationCode, config.smartThings);
  if (!confirmCheck.valid) return { valid: false, reason: confirmCheck.reason };

  // 4. Vérification audit
  if (!config.smartThings.sceneAuditEnabled) {
    return { valid: false, reason: 'Audit requis. Gardez SMARTTHINGS_SCENE_AUDIT_ENABLED=true.' };
  }

  // 5. Vérification commandes directes bloquées
  if (config.smartThings.blockDeviceCommands === false) {
    return { valid: false, reason: 'SMARTTHINGS_BLOCK_DEVICE_COMMANDS doit rester true.' };
  }

  return { valid: true };
}

/* ── Exécution d'une scène ───────────────────── */
async function executeScene(sceneId, options = {}) {
  const pre = preflight();
  if (pre.blocked) return { success: false, status: pre.status, error: 'SmartThings non disponible.' };

  // Validation complète avant toute action
  const validation = await validateSceneBeforeExecution(sceneId, options);
  if (!validation.valid) {
    return { success: false, status: 'blocked', error: validation.reason };
  }

  const maskedSceneId = safety.maskSmartThingsId(sceneId);
  const requestedAt   = new Date().toISOString();
  const auditId       = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  // Récupérer le nom de la scène si possible
  let sceneName = options.sceneName || 'Scène';
  try {
    const locationParam = config.smartThings.defaultLocationId
      ? `?locationId=${config.smartThings.defaultLocationId}` : '';
    const scenesRes = await stGet(`/v1/scenes${locationParam}`);
    if (scenesRes.statusCode === 200) {
      const found = (scenesRes.data.items || []).find(s => s.sceneId === sceneId);
      if (found) sceneName = found.sceneName;
    }
  } catch { /* non bloquant — on continue sans le nom */ }

  try {
    // Seul appel POST autorisé dans cette phase : POST /scenes/{id}/execute
    const res = await stPost(`/v1/scenes/${sceneId}/execute`);
    const executedAt = new Date().toISOString();

    let status = 'executed';
    let error  = null;

    if (res.statusCode === 401) {
      status = 'unauthorized';
      error  = 'Token invalide ou expiré.';
    } else if (res.statusCode >= 400) {
      status = 'failed';
      error  = `Erreur SmartThings (${res.statusCode})`;
    }

    // Audit local — toujours, succès ou échec
    const entry = safety.buildSceneAuditEntry({
      auditId, sceneId, sceneName, requestedAt, executedAt,
      status, reason: options.reason || '',
      confirmationUsed: !!(options.confirmationCode),
    });
    await writeSceneAudit(entry);

    if (error) return { success: false, status, error, sceneId: maskedSceneId, auditId };

    return {
      success:         true,
      status:          'executed',
      sceneId:         maskedSceneId,
      sceneName,
      executedAt,
      auditId,
      securityWarning: 'Exécution de scène SmartThings — aucune commande directe à un appareil.',
    };
  } catch (err) {
    const executedAt = new Date().toISOString();
    const entry = safety.buildSceneAuditEntry({
      auditId, sceneId, sceneName, requestedAt, executedAt,
      status: 'error', reason: options.reason || '',
      confirmationUsed: !!(options.confirmationCode),
    });
    await writeSceneAudit(entry).catch(() => {});
    return { success: false, status: 'error', sceneId: maskedSceneId, auditId, ...safety.sanitizeSmartThingsError(err) };
  }
}

/* ── Audit local ─────────────────────────────── */

function getAuditFilePath() {
  const rel = config.smartThings.sceneAuditPath || 'runtime/smartthings-scene-audit.json';
  return path.resolve(process.cwd(), rel);
}

async function writeSceneAudit(entry) {
  const filePath = getAuditFilePath();
  let current = { entries: [], lastUpdatedAt: null };
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    current = JSON.parse(raw);
  } catch { /* fichier inexistant ou corrompu — on repart de zéro */ }

  current.entries.unshift(entry);   // Plus récent en premier
  if (current.entries.length > 100) current.entries = current.entries.slice(0, 100);
  current.lastUpdatedAt = new Date().toISOString();

  fs.writeFileSync(filePath, JSON.stringify(current, null, 2), 'utf8');
}

async function getSceneAuditHistory() {
  const filePath = getAuditFilePath();
  try {
    const raw  = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    return {
      status:          'ok',
      count:           (data.entries || []).length,
      entries:         data.entries || [],
      lastUpdatedAt:   data.lastUpdatedAt || null,
    };
  } catch {
    return { status: 'ok', count: 0, entries: [], lastUpdatedAt: null };
  }
}

async function clearSceneAuditHistory() {
  const filePath = getAuditFilePath();
  const empty    = { entries: [], lastUpdatedAt: new Date().toISOString() };
  fs.writeFileSync(filePath, JSON.stringify(empty, null, 2), 'utf8');
  return { status: 'cleared', message: 'Historique d\'audit effacé.' };
}

/* ═════════════════════════════════════════════
   PHASE 10 — Commandes TV contrôlées
   TV allowlistée + commande allowlistée
   + confirmation + audit obligatoires.
   Uniquement POST /devices/{id}/commands.
═════════════════════════════════════════════ */

/* ── Convertit "capability.command" → objet SmartThings ── */
function parseTvCommand(commandStr) {
  if (!commandStr || typeof commandStr !== 'string') return null;
  const dot = commandStr.indexOf('.');
  if (dot < 1) return null;
  const capability = commandStr.slice(0, dot);
  const command    = commandStr.slice(dot + 1);
  if (!capability || !command) return null;
  return { component: 'main', capability, command, arguments: [] };
}

/* ── Helper POST pour commandes TV (deviceId/commands) ─── */
function stPostTvCommand(deviceId, commandBody) {
  return new Promise((resolve, reject) => {
    let headers;
    try {
      headers = safety.buildSmartThingsHeaders(config.smartThings);
    } catch (err) {
      return reject(err);
    }

    const bodyStr = JSON.stringify(commandBody);
    const options = {
      hostname: 'api.smartthings.com',
      port:     443,
      path:     `/v1/devices/${deviceId}/commands`,
      method:   'POST',
      headers:  { ...headers, 'Content-Length': Buffer.byteLength(bodyStr) },
      timeout:  config.smartThings.commandTimeout || 5000,
    };

    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        let data = {};
        try { data = body ? JSON.parse(body) : {}; } catch { /* empty body OK */ }
        resolve({ statusCode: res.statusCode, data });
      });
    });

    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout commande TV')); });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

/* ── Politique commandes TV ───────────────── */
function getTvCommandPolicy() {
  const deviceAllowlist  = (config.smartThings.tvDeviceAllowlist  || '').split(',').map(s => s.trim()).filter(Boolean);
  const commandAllowlist = (config.smartThings.tvCommandAllowlist || '').split(',').map(s => s.trim()).filter(Boolean);
  return {
    enabled:                      config.smartThings.tvCommandsEnabled,
    confirmationRequired:         config.smartThings.tvCommandsRequireConfirmation,
    confirmationCodeHint:         config.smartThings.tvCommandsRequireConfirmation ? '[code requis]' : '[non requis]',
    deviceAllowlistCount:         deviceAllowlist.length,
    deviceAllowlistConfigured:    deviceAllowlist.length > 0,
    commandAllowlist,
    auditEnabled:                 config.smartThings.tvAuditEnabled,
    blockedCommandFamilies: {
      volume: config.smartThings.tvBlockVolumeCommands !== false,
      keypad: config.smartThings.tvBlockKeypadInput    !== false,
      source: config.smartThings.tvBlockSourceChange   !== false,
    },
    deviceCommandsRestrictedToTv: true,
  };
}

/* ── TV allowlistées ─────────────────────── */
async function getAllowedTvDevices() {
  const policy         = getTvCommandPolicy();
  const deviceAllowlist = (config.smartThings.tvDeviceAllowlist || '').split(',').map(s => s.trim()).filter(Boolean);

  if (!policy.enabled) {
    return { status: 'disabled', devices: [], policy, message: 'Activez SMARTTHINGS_TV_COMMANDS_ENABLED=true' };
  }
  if (deviceAllowlist.length === 0) {
    return { status: 'no_allowlist', devices: [], policy, message: 'Configurez SMARTTHINGS_TV_DEVICE_ALLOWLIST dans .env' };
  }

  const pre = preflight();
  if (pre.blocked) return { status: pre.status, devices: [], policy };

  try {
    const res = await stGet('/v1/devices');
    if (res.statusCode === 401) return { status: 'unauthorized', devices: [], policy };

    const allDevices = res.data.items || [];
    const allowed = allDevices
      .filter(d => deviceAllowlist.includes(d.deviceId))
      .map(d => ({
        deviceId:        safety.maskSmartThingsId(d.deviceId),
        deviceIdRaw:     d.deviceId,  // non-masqué — pour les appels d'exécution côté serveur
        name:            d.name,
        label:           d.label,
        type:            d.type,
        locationId:      safety.maskSmartThingsId(d.locationId),
        allowedCommands: policy.commandAllowlist,
        restrictedToTv:  true,
      }));

    return { status: 'available', count: allowed.length, devices: allowed, policy };
  } catch (err) {
    return { status: 'unavailable', devices: [], policy, ...safety.sanitizeSmartThingsError(err) };
  }
}

/* ── Capabilities TV (nettoyées) ─────────── */
async function getTvCapabilities(deviceId) {
  const maskedId     = safety.maskSmartThingsId(deviceId);
  const commandPolicy = getTvCommandPolicy();

  if (!commandPolicy.enabled) {
    return { status: 'disabled', deviceId: maskedId, message: 'Commandes TV désactivées.' };
  }

  const deviceCheck = safety.validateTvDeviceAllowed(deviceId, config.smartThings);
  if (!deviceCheck.valid) {
    return { status: 'blocked', deviceId: maskedId, message: deviceCheck.reason };
  }

  const pre = preflight();
  if (pre.blocked) return { status: pre.status, deviceId: maskedId };

  try {
    const res = await stGet(`/v1/devices/${deviceId}`);
    if (res.statusCode === 401) return { status: 'unauthorized', deviceId: maskedId };
    if (res.statusCode === 404) return { status: 'not_found', deviceId: maskedId };

    const device       = res.data;
    const components   = device.components || [];
    const capabilityList = [];

    for (const comp of components) {
      for (const cap of (comp.capabilities || [])) {
        capabilityList.push({ id: cap.id, version: cap.version });
      }
    }

    const tvRelevant = ['switch', 'mediaPlayback', 'audioVolume', 'audioMute',
                        'mediaInputSource', 'keypadInput', 'tvChannel', 'refresh'];
    const filtered = capabilityList.filter(c => tvRelevant.some(t => (c.id || '').toLowerCase().includes(t.toLowerCase())));

    return {
      status:          'available',
      deviceId:        maskedId,
      deviceName:      device.label || device.name,
      capabilities:    filtered.length > 0 ? filtered : capabilityList.slice(0, 20),
      allowedCommands: commandPolicy.commandAllowlist,
      restrictedToTv:  true,
    };
  } catch (err) {
    return { status: 'unavailable', deviceId: maskedId, ...safety.sanitizeSmartThingsError(err) };
  }
}

/* ── Prévisualisation commande TV ─────────── */
async function previewTvCommand(deviceId, command) {
  const maskedId      = safety.maskSmartThingsId(deviceId);
  const commandPolicy = getTvCommandPolicy();
  const deviceAllowlist = (config.smartThings.tvDeviceAllowlist || '').split(',').map(s => s.trim()).filter(Boolean);
  const parsed        = parseTvCommand(command);

  return {
    status:            'preview_only',
    deviceId:          maskedId,
    command,
    parsed:            parsed || 'Format invalide (attendu: capability.command)',
    wouldSend:         parsed ? { component: parsed.component, capability: parsed.capability, command: parsed.command, arguments: parsed.arguments } : null,
    commandAllowed:    commandPolicy.commandAllowlist.includes(command),
    deviceAllowlisted: deviceAllowlist.includes(deviceId),
    tvCommandsEnabled: commandPolicy.enabled,
    message:           'Prévisualisation uniquement — aucune commande envoyée à la TV.',
    securityWarning:   'En exécution réelle : POST /devices/{id}/commands · TV allowlistée uniquement',
    restrictedToTv:    true,
  };
}

/* ── Exécution commande TV ────────────────── */
async function executeTvCommand(deviceId, command, options = {}) {
  const pre = preflight();
  if (pre.blocked) return { success: false, status: pre.status, error: 'SmartThings non disponible.' };

  // 1. Commandes TV activées
  const enabledCheck = safety.validateTvCommandsEnabled(config.smartThings);
  if (!enabledCheck.valid) return { success: false, status: 'disabled', error: enabledCheck.reason };

  // 2. TV dans l'allowlist
  const deviceCheck = safety.validateTvDeviceAllowed(deviceId, config.smartThings);
  if (!deviceCheck.valid) return { success: false, status: 'blocked', error: deviceCheck.reason };

  // 3. Commande dans l'allowlist + familles bloquées
  const commandCheck = safety.validateTvCommandAllowed(command, config.smartThings);
  if (!commandCheck.valid) return { success: false, status: 'blocked', error: commandCheck.reason };

  // 4. Code de confirmation
  const confirmCheck = safety.validateTvConfirmationCode(options.confirmationCode, config.smartThings);
  if (!confirmCheck.valid) return { success: false, status: 'blocked', error: confirmCheck.reason };

  // 5. Audit activé
  if (!config.smartThings.tvAuditEnabled) {
    return { success: false, status: 'blocked', error: 'Audit TV requis. Gardez SMARTTHINGS_TV_AUDIT_ENABLED=true.' };
  }

  const maskedId    = safety.maskSmartThingsId(deviceId);
  const requestedAt = new Date().toISOString();
  const auditId     = `tv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  // Récupérer le nom de la TV
  let deviceName = 'TV Samsung';
  try {
    const devRes = await stGet(`/v1/devices/${deviceId}`);
    if (devRes.statusCode === 200) deviceName = devRes.data.label || devRes.data.name || deviceName;
  } catch { /* non bloquant */ }

  const parsed = parseTvCommand(command);
  if (!parsed) {
    return { success: false, status: 'error', error: 'Format de commande invalide (attendu: capability.command)' };
  }

  try {
    const res        = await stPostTvCommand(deviceId, { commands: [parsed] });
    const executedAt = new Date().toISOString();

    let status = 'executed';
    let error  = null;

    if (res.statusCode === 401)   { status = 'unauthorized'; error = 'Token invalide ou expiré.'; }
    else if (res.statusCode >= 400) { status = 'failed'; error = `Erreur SmartThings (${res.statusCode})`; }

    const entry = safety.buildTvAuditEntry({
      auditId, deviceId, deviceName, command, requestedAt, executedAt,
      status, reason: options.reason || '',
      confirmationUsed: !!(options.confirmationCode),
    });
    await writeTvAudit(entry);

    if (error) return { success: false, status, error, deviceId: maskedId, auditId };

    return {
      success:         true,
      status:          'executed',
      deviceId:        maskedId,
      deviceName,
      command,
      executedAt,
      auditId,
      restrictedToTv:  true,
      securityWarning: 'Commande TV SmartThings exécutée — TV allowlistée uniquement, aucun appareil sensible.',
    };
  } catch (err) {
    const executedAt = new Date().toISOString();
    const entry = safety.buildTvAuditEntry({
      auditId, deviceId, deviceName, command, requestedAt, executedAt,
      status: 'error', reason: options.reason || '',
      confirmationUsed: !!(options.confirmationCode),
    });
    await writeTvAudit(entry).catch(() => {});
    return { success: false, status: 'error', deviceId: maskedId, auditId, ...safety.sanitizeSmartThingsError(err) };
  }
}

/* ── Audit TV ────────────────────────────── */

function getTvAuditFilePath() {
  const rel = config.smartThings.tvAuditPath || 'runtime/smartthings-tv-audit.json';
  return path.resolve(process.cwd(), rel);
}

async function writeTvAudit(entry) {
  const filePath = getTvAuditFilePath();
  let current = { entries: [], lastUpdatedAt: null };
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    current = JSON.parse(raw);
  } catch { /* fichier inexistant — on repart de zéro */ }

  current.entries.unshift(entry);
  if (current.entries.length > 100) current.entries = current.entries.slice(0, 100);
  current.lastUpdatedAt = new Date().toISOString();
  fs.writeFileSync(filePath, JSON.stringify(current, null, 2), 'utf8');
}

async function getTvAuditHistory() {
  const filePath = getTvAuditFilePath();
  try {
    const raw  = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    return { status: 'ok', count: (data.entries || []).length, entries: data.entries || [], lastUpdatedAt: data.lastUpdatedAt || null };
  } catch {
    return { status: 'ok', count: 0, entries: [], lastUpdatedAt: null };
  }
}

async function clearTvAuditHistory() {
  const filePath = getTvAuditFilePath();
  const empty    = { entries: [], lastUpdatedAt: new Date().toISOString() };
  fs.writeFileSync(filePath, JSON.stringify(empty, null, 2), 'utf8');
  return { status: 'cleared', message: 'Historique d\'audit TV effacé.' };
}

module.exports = {
  /* Phase 8 */
  getStatus,
  getCapabilities,
  listLocations,
  listDevices,
  getDevice,
  getDeviceStatus,
  findSamsungTv,
  getTvStatus,
  listScenes,
  previewSceneExecution,
  getSafeDiagnostics,
  /* Phase 9 */
  getSceneExecutionPolicy,
  getExecutableScenes,
  validateSceneBeforeExecution,
  executeScene,
  writeSceneAudit,
  getSceneAuditHistory,
  clearSceneAuditHistory,
  /* Phase 10 */
  getTvCommandPolicy,
  getAllowedTvDevices,
  getTvCapabilities,
  previewTvCommand,
  executeTvCommand,
  writeTvAudit,
  getTvAuditHistory,
  clearTvAuditHistory,
};

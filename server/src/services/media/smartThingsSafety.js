'use strict';
/* =============================================
   smartThingsSafety.js — Phase 8 + 9
   Sécurité centrale SmartThings.
   Règles absolues :
   - jamais logger ou retourner le token
   - masquer les IDs si SMARTTHINGS_MASK_IDS=true
   - bloquer toute opération non autorisée
   - exécution scène uniquement si opt-in complet
============================================= */

const ALLOWED_OPERATIONS = [
  'GET /locations',
  'GET /devices',
  'GET /devices/{deviceId}',
  'GET /devices/{deviceId}/status',
  'GET /scenes',
  'POST /scenes/{sceneId}/execute  [opt-in — allowlist + confirmation + audit requis]',
];

const BLOCKED_OPERATIONS = [
  'POST /devices/{deviceId}/commands  [sauf TV allowlistée opt-in Phase 10]',
  'POST /rules',
  'PUT /rules',
  'DELETE /rules',
  'Toute commande directe vers un appareil non TV',
  'Tout contrôle de serrure, caméra, alarme, garage, four, thermostat',
  'audioVolume.* / audioMute.* (bloqués par défaut)',
  'keypadInput.sendKey (bloqué par défaut)',
  'mediaInputSource.setInputSource (bloqué par défaut)',
];

const SENSITIVE_DEVICE_PATTERN = /lock|camera|alarm|garage|oven|stove|thermostat|security|door|window|siren/i;

const WRITE_PATTERNS = [
  /^POST.*commands/i,
  /^POST.*rules/i,
  /^PUT.*rules/i,
  /^DELETE.*rules/i,
  /device.*command/i,
];

/* ─────────────────────────────────────────────
   PHASE 8 — Fonctions de base
───────────────────────────────────────────── */

function maskSmartThingsId(value) {
  if (!value || typeof value !== 'string') return value;
  if (process.env.SMARTTHINGS_MASK_IDS === 'false') return value;
  if (value.length <= 4) return '***';
  return `${value.substring(0, 4)}***${value.slice(-1)}`;
}

function maskToken(value) {
  if (!value || typeof value !== 'string' || !value.trim()) return '[token-absent]';
  return '[token-masqué]';
}

function sanitizeSmartThingsResponse(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  if (Array.isArray(payload)) return payload.map(sanitizeSmartThingsResponse);

  const out = { ...payload };
  delete out.token;
  delete out.accessToken;
  delete out.authToken;
  delete out.bearerToken;

  if (process.env.SMARTTHINGS_MASK_IDS !== 'false') {
    if (out.deviceId)   out.deviceId   = maskSmartThingsId(out.deviceId);
    if (out.locationId) out.locationId = maskSmartThingsId(out.locationId);
    if (out.sceneId)    out.sceneId    = maskSmartThingsId(out.sceneId);
    if (out.roomId)     out.roomId     = maskSmartThingsId(out.roomId);
  }

  return out;
}

function sanitizeSmartThingsError(error) {
  if (!error) return { message: 'Erreur inconnue SmartThings' };

  let message = error.message || String(error);

  const token = process.env.SMARTTHINGS_TOKEN || '';
  if (token && message.includes(token)) {
    message = message.split(token).join('[token-masqué]');
  }
  message = message.replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/g, 'Bearer [token-masqué]');

  return {
    message,
    ...(error.code       ? { code: error.code }             : {}),
    ...(error.statusCode ? { statusCode: error.statusCode } : {}),
  };
}

function validateSmartThingsConfig(config) {
  if (!config) return { valid: false, errors: ['Configuration SmartThings manquante'] };
  if (!config.enabled) {
    return { valid: false, disabled: true, errors: ['SmartThings désactivé (SMARTTHINGS_ENABLED=false)'] };
  }
  const errors = [];
  if (!config.token || !config.token.trim()) errors.push('SMARTTHINGS_TOKEN absent ou vide');
  if (config.readOnly !== true)              errors.push('SMARTTHINGS_READ_ONLY doit être true');
  return { valid: errors.length === 0, disabled: false, errors };
}

function assertReadOnlyOperation(operationName) {
  for (const pattern of WRITE_PATTERNS) {
    if (pattern.test(operationName)) {
      const err = new Error(`Opération interdite : "${operationName}"`);
      err.code = 'READ_ONLY_VIOLATION';
      throw err;
    }
  }
}

function buildSmartThingsHeaders(config) {
  if (!config || !config.token || !config.token.trim()) {
    throw new Error('Token SmartThings absent — impossible de construire les headers');
  }
  return {
    Authorization: `Bearer ${config.token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

/* ─────────────────────────────────────────────
   PHASE 9 — Exécution contrôlée de scènes
───────────────────────────────────────────── */

/* Vérifie que l'exécution de scènes est activée */
function validateSceneExecutionEnabled(config) {
  if (!config.allowSceneExecution) {
    return {
      valid: false,
      reason: 'Exécution de scènes désactivée par sécurité. Activez SMARTTHINGS_ALLOW_SCENE_EXECUTION=true dans .env.',
    };
  }
  if (!config.sceneAuditEnabled) {
    return {
      valid: false,
      reason: 'L\'audit est obligatoire pour l\'exécution de scènes. Gardez SMARTTHINGS_SCENE_AUDIT_ENABLED=true.',
    };
  }
  return { valid: true };
}

/* Vérifie que la scène est dans l'allowlist */
function validateSceneInAllowlist(sceneId, config) {
  const allowlist = (config.sceneAllowlist || '')
    .split(',').map(s => s.trim()).filter(Boolean);

  if (allowlist.length === 0) {
    return {
      valid: false,
      reason: 'Aucune scène allowlistée. Ajoutez des IDs à SMARTTHINGS_SCENE_ALLOWLIST dans .env.',
    };
  }
  if (!allowlist.includes(sceneId)) {
    return {
      valid: false,
      reason: 'Scène non autorisée. Ajoutez son ID à SMARTTHINGS_SCENE_ALLOWLIST dans .env.',
    };
  }
  return { valid: true };
}

/* Vérifie le code de confirmation utilisateur */
function validateConfirmationCode(input, config) {
  if (!config.sceneExecutionRequireConfirmation) return { valid: true };

  if (!input || typeof input !== 'string' || !input.trim()) {
    return {
      valid: false,
      reason: 'Confirmation utilisateur requise. Fournissez le code dans le champ "confirmationCode".',
    };
  }
  const expected = config.sceneExecutionConfirmationCode || 'CONFIRMER';
  if (input.trim() !== expected) {
    return {
      valid: false,
      reason: 'Code de confirmation incorrect.',
    };
  }
  return { valid: true };
}

/* Vérifie qu'un appareil n'est pas sensible */
function blockSensitiveDeviceTypes(device) {
  if (!device) return;
  const combined = [
    device.name || '',
    device.label || '',
    device.type || '',
    ...(Array.isArray(device.capabilities) ? device.capabilities : []),
  ].join(' ');

  if (SENSITIVE_DEVICE_PATTERN.test(combined)) {
    const err = new Error(
      `Appareil sensible bloqué : "${device.label || device.name || 'inconnu'}". ` +
      'Les appareils sensibles (serrure, caméra, alarme, etc.) ne sont pas autorisés dans cette phase.'
    );
    err.code = 'SENSITIVE_DEVICE_BLOCKED';
    throw err;
  }
}

/* Bloque toute tentative de commande directe d'appareil */
function blockDeviceCommands() {
  const err = new Error(
    'Commandes directes d\'appareil bloquées. Seule l\'exécution de scènes allowlistées est autorisée.'
  );
  err.code = 'DEVICE_COMMANDS_BLOCKED';
  throw err;
}

/* Nettoie le résultat d'exécution d'une scène */
function sanitizeSceneExecutionResult(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  const out = { ...payload };
  delete out.token;
  delete out.accessToken;
  delete out.authToken;
  // Mask sceneId if present and masking enabled
  if (out.sceneId && process.env.SMARTTHINGS_MASK_IDS !== 'false') {
    out.sceneId = maskSmartThingsId(out.sceneId);
  }
  return out;
}

/* Construit une entrée d'audit locale — jamais de données sensibles */
function buildSceneAuditEntry(data) {
  return {
    auditId:            data.auditId,
    sceneIdMasked:      maskSmartThingsId(data.sceneId || ''),
    sceneName:          data.sceneName || 'Scène inconnue',
    requestedAt:        data.requestedAt,
    executedAt:         data.executedAt || null,
    status:             data.status,
    reason:             (data.reason || '').substring(0, 200),
    confirmationUsed:   data.confirmationUsed || false,
    source:             'Sallon-ConnecT',
    tokenExposed:       false,
    deviceCommandsUsed: false,
  };
}

/* ─────────────────────────────────────────────
   PHASE 10 — Commandes TV contrôlées
───────────────────────────────────────────── */

const BLOCKED_TV_COMMAND_FAMILIES = {
  volume: ['audioVolume.setVolume', 'audioVolume.volumeUp', 'audioVolume.volumeDown', 'audioMute.mute', 'audioMute.unmute'],
  keypad: ['keypadInput.sendKey'],
  source: ['mediaInputSource.setInputSource'],
};

/* Vérifie que les commandes TV sont activées */
function validateTvCommandsEnabled(config) {
  if (!config.tvCommandsEnabled) {
    return {
      valid: false,
      reason: 'Commandes TV désactivées par sécurité. Activez SMARTTHINGS_TV_COMMANDS_ENABLED=true dans .env.',
    };
  }
  if (!config.tvAuditEnabled) {
    return {
      valid: false,
      reason: 'L\'audit est obligatoire pour les commandes TV. Gardez SMARTTHINGS_TV_AUDIT_ENABLED=true.',
    };
  }
  return { valid: true };
}

/* Vérifie que la TV est dans l'allowlist */
function validateTvDeviceAllowed(deviceId, config) {
  const allowlist = (config.tvDeviceAllowlist || '').split(',').map(s => s.trim()).filter(Boolean);
  if (allowlist.length === 0) {
    return { valid: false, reason: 'TV non autorisée. Ajoutez son ID à SMARTTHINGS_TV_DEVICE_ALLOWLIST.' };
  }
  if (!allowlist.includes(deviceId)) {
    return { valid: false, reason: 'TV non autorisée. Ajoutez son ID à SMARTTHINGS_TV_DEVICE_ALLOWLIST.' };
  }
  return { valid: true };
}

/* Vérifie que la commande TV est autorisée (allowlist + familles bloquées) */
function validateTvCommandAllowed(command, config) {
  if (!command || typeof command !== 'string') {
    return { valid: false, reason: 'Commande TV invalide ou absente.' };
  }

  // Familles bloquées : volume, keypad, source
  if (config.tvBlockVolumeCommands !== false) {
    if (BLOCKED_TV_COMMAND_FAMILIES.volume.includes(command)) {
      return { valid: false, reason: `Commande TV non autorisée : ${command} (famille volume bloquée — SMARTTHINGS_TV_BLOCK_VOLUME_COMMANDS=true).` };
    }
  }
  if (config.tvBlockKeypadInput !== false) {
    if (BLOCKED_TV_COMMAND_FAMILIES.keypad.includes(command)) {
      return { valid: false, reason: `Commande TV non autorisée : ${command} (keypad bloqué — SMARTTHINGS_TV_BLOCK_KEYPAD_INPUT=true).` };
    }
  }
  if (config.tvBlockSourceChange !== false) {
    if (BLOCKED_TV_COMMAND_FAMILIES.source.includes(command)) {
      return { valid: false, reason: `Commande TV non autorisée : ${command} (changement source bloqué — SMARTTHINGS_TV_BLOCK_SOURCE_CHANGE=true).` };
    }
  }

  // Vérification contre l'allowlist
  const allowlist = (config.tvCommandAllowlist || '').split(',').map(s => s.trim()).filter(Boolean);
  if (allowlist.length === 0) {
    return { valid: false, reason: 'Commande TV non autorisée : aucune commande configurée dans SMARTTHINGS_TV_COMMAND_ALLOWLIST.' };
  }
  if (!allowlist.includes(command)) {
    return { valid: false, reason: 'Commande TV non autorisée.' };
  }
  return { valid: true };
}

/* Vérifie le code de confirmation pour commande TV */
function validateTvConfirmationCode(input, config) {
  if (!config.tvCommandsRequireConfirmation) return { valid: true };
  if (!input || typeof input !== 'string' || !input.trim()) {
    return {
      valid: false,
      reason: 'Confirmation utilisateur requise. Fournissez le code dans le champ "confirmationCode".',
    };
  }
  const expected = config.tvConfirmationCode || 'CONFIRMER_TV';
  if (input.trim() !== expected) {
    return { valid: false, reason: 'Code de confirmation incorrect.' };
  }
  return { valid: true };
}

/* Bloque explicitement les commandes TV sensibles */
function blockSensitiveTvCommand(command) {
  const allBlocked = [
    ...BLOCKED_TV_COMMAND_FAMILIES.volume,
    ...BLOCKED_TV_COMMAND_FAMILIES.keypad,
    ...BLOCKED_TV_COMMAND_FAMILIES.source,
  ];
  if (allBlocked.includes(command)) {
    const err = new Error(
      `Commande TV sensible bloquée : "${command}". Cette commande n'est pas autorisée dans la politique TV.`
    );
    err.code = 'SENSITIVE_TV_COMMAND_BLOCKED';
    throw err;
  }
}

/* Nettoie le résultat d'une commande TV */
function sanitizeTvCommandResult(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  const out = { ...payload };
  delete out.token;
  delete out.accessToken;
  delete out.authToken;
  if (out.deviceId && process.env.SMARTTHINGS_MASK_IDS !== 'false') {
    out.deviceId = maskSmartThingsId(out.deviceId);
  }
  return out;
}

/* Construit une entrée d'audit TV — jamais de données sensibles */
function buildTvAuditEntry(data) {
  return {
    auditId:          data.auditId,
    deviceIdMasked:   maskSmartThingsId(data.deviceId || ''),
    deviceName:       data.deviceName || 'TV',
    command:          data.command,
    requestedAt:      data.requestedAt,
    executedAt:       data.executedAt || null,
    status:           data.status,
    reason:           (data.reason || '').substring(0, 200),
    confirmationUsed: data.confirmationUsed || false,
    source:           'Sallon-ConnecT',
    tokenExposed:     false,
    restrictedToTv:   true,
  };
}

module.exports = {
  /* Phase 8 */
  maskSmartThingsId,
  maskToken,
  sanitizeSmartThingsResponse,
  sanitizeSmartThingsError,
  validateSmartThingsConfig,
  assertReadOnlyOperation,
  buildSmartThingsHeaders,
  ALLOWED_OPERATIONS,
  BLOCKED_OPERATIONS,
  /* Phase 9 */
  validateSceneExecutionEnabled,
  validateSceneInAllowlist,
  validateConfirmationCode,
  blockSensitiveDeviceTypes,
  blockDeviceCommands,
  sanitizeSceneExecutionResult,
  buildSceneAuditEntry,
  /* Phase 10 */
  validateTvCommandsEnabled,
  validateTvDeviceAllowed,
  validateTvCommandAllowed,
  validateTvConfirmationCode,
  blockSensitiveTvCommand,
  sanitizeTvCommandResult,
  buildTvAuditEntry,
  BLOCKED_TV_COMMAND_FAMILIES,
};

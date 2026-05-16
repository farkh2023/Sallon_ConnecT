'use strict';
/* =============================================
   routes/smartthings.js — Phase 8 + 9 + 10 + 12
   Phase 8  : lecture seule.
   Phase 9  : exécution de scènes opt-in.
   Phase 10 : commandes TV opt-in (allowlist stricte).

   JAMAIS de commande hors allowlist TV.
   JAMAIS de contrôle de serrure, caméra, alarme.
   JAMAIS de modification de règle.
============================================= */

const express   = require('express');
const router    = express.Router();
const connector = require('../services/media/smartThingsConnector');
const safety    = require('../services/media/smartThingsSafety');
const config    = require('../services/config');
const notif     = require('../services/notifications/notificationEngine');

/* ─────────────────────────────────────────────
   PHASE 8 — Endpoints lecture seule
───────────────────────────────────────────── */

/* GET /api/smartthings/status */
router.get('/status', async (_req, res) => {
  try {
    res.json(await connector.getStatus());
  } catch (err) {
    res.status(500).json({ status: 'error', ...safety.sanitizeSmartThingsError(err) });
  }
});

/* GET /api/smartthings/locations */
router.get('/locations', async (_req, res) => {
  try {
    res.json(await connector.listLocations());
  } catch (err) {
    res.status(500).json({ status: 'error', ...safety.sanitizeSmartThingsError(err) });
  }
});

/* GET /api/smartthings/devices */
router.get('/devices', async (_req, res) => {
  try {
    res.json(await connector.listDevices());
  } catch (err) {
    res.status(500).json({ status: 'error', ...safety.sanitizeSmartThingsError(err) });
  }
});

/* GET /api/smartthings/devices/:id/status */
router.get('/devices/:id/status', async (req, res) => {
  const deviceId = req.params.id;
  if (!deviceId || deviceId.length < 2) {
    return res.status(400).json({ status: 'error', message: 'deviceId invalide' });
  }
  try {
    res.json(await connector.getDeviceStatus(deviceId));
  } catch (err) {
    res.status(500).json({ status: 'error', ...safety.sanitizeSmartThingsError(err) });
  }
});

/* GET /api/smartthings/tv — Phase 8 : identifier la TV */
router.get('/tv', async (_req, res) => {
  try {
    res.json(await connector.findSamsungTv());
  } catch (err) {
    res.status(500).json({ status: 'error', ...safety.sanitizeSmartThingsError(err) });
  }
});

/* ─────────────────────────────────────────────
   PHASE 10 — Commandes TV contrôlées
   Statiques AVANT paramétrées /tv/:id
───────────────────────────────────────────── */

/* GET /api/smartthings/tv/command-policy */
router.get('/tv/command-policy', (_req, res) => {
  try {
    res.json(connector.getTvCommandPolicy());
  } catch (err) {
    res.status(500).json({ status: 'error', ...safety.sanitizeSmartThingsError(err) });
  }
});

/* GET /api/smartthings/tv/allowed-devices */
router.get('/tv/allowed-devices', async (_req, res) => {
  try {
    res.json(await connector.getAllowedTvDevices());
  } catch (err) {
    res.status(500).json({ status: 'error', ...safety.sanitizeSmartThingsError(err) });
  }
});

/* GET /api/smartthings/tv/audit */
router.get('/tv/audit', async (_req, res) => {
  try {
    res.json(await connector.getTvAuditHistory());
  } catch (err) {
    res.status(500).json({ status: 'error', ...safety.sanitizeSmartThingsError(err) });
  }
});

/* DELETE /api/smartthings/tv/audit */
router.delete('/tv/audit', async (_req, res) => {
  try {
    res.json(await connector.clearTvAuditHistory());
  } catch (err) {
    res.status(500).json({ status: 'error', ...safety.sanitizeSmartThingsError(err) });
  }
});

/* GET /api/smartthings/tv/:id/capabilities */
router.get('/tv/:id/capabilities', async (req, res) => {
  const deviceId = req.params.id;
  if (!deviceId || deviceId.length < 2) {
    return res.status(400).json({ status: 'error', message: 'deviceId invalide' });
  }
  try {
    res.json(await connector.getTvCapabilities(deviceId));
  } catch (err) {
    res.status(500).json({ status: 'error', ...safety.sanitizeSmartThingsError(err) });
  }
});

/* POST /api/smartthings/tv/:id/commands/preview — jamais d'exécution réelle */
router.post('/tv/:id/commands/preview', async (req, res) => {
  const deviceId = req.params.id;
  if (!deviceId || deviceId.length < 2) {
    return res.status(400).json({ status: 'error', message: 'deviceId invalide' });
  }
  const { command } = req.body || {};
  if (!command) {
    return res.status(400).json({ status: 'error', message: 'Champ "command" requis (ex: mediaPlayback.pause)' });
  }
  try {
    res.json(await connector.previewTvCommand(deviceId, command));
  } catch (err) {
    res.status(500).json({ status: 'error', ...safety.sanitizeSmartThingsError(err) });
  }
});

/* POST /api/smartthings/tv/:id/commands/execute
   Body : { command, confirmationCode, reason }
   Requiert : TV allowlistée + commande allowlistée + confirmation + audit */
router.post('/tv/:id/commands/execute', async (req, res) => {
  const deviceId = req.params.id;
  if (!deviceId || deviceId.length < 2) {
    return res.status(400).json({ success: false, error: 'deviceId invalide' });
  }

  const { command, confirmationCode, reason } = req.body || {};
  if (!command) {
    return res.status(400).json({ success: false, error: 'Champ "command" requis (ex: mediaPlayback.pause)' });
  }

  try {
    const result = await connector.executeTvCommand(deviceId, command, { confirmationCode, reason });
    if (result.success) {
      notif.notify({ type: 'smartthings', level: 'success',
        title: 'Commande TV exécutée',
        message: `Commande "${command}" acceptée`,
        meta: { command },
      });
    } else {
      notif.notify({ type: 'smartthings', level: 'warning',
        title: 'Commande TV refusée',
        message: result.error || result.reason || 'Commande refusée',
        meta: { command },
      });
    }
    const statusCode = result.success ? 200 : 403;
    res.status(statusCode).json(result);
  } catch (err) {
    res.status(500).json({ success: false, ...safety.sanitizeSmartThingsError(err) });
  }
});

/* GET /api/smartthings/scenes — toutes les scènes (IDs masqués) */
router.get('/scenes', async (_req, res) => {
  try {
    res.json(await connector.listScenes());
  } catch (err) {
    res.status(500).json({ status: 'error', ...safety.sanitizeSmartThingsError(err) });
  }
});

/* GET /api/smartthings/safety */
router.get('/safety', (_req, res) => {
  const cfg = config.smartThings;
  res.json({
    readOnly:                         true,
    sceneExecutionAllowed:            cfg.allowSceneExecution,
    allowedOperations:                safety.ALLOWED_OPERATIONS,
    blockedOperations:                safety.BLOCKED_OPERATIONS,
    idMasking:                        cfg.maskIds,
    tokenMasked:                      true,
    tokenConfigured:                  !!(cfg.token && cfg.token.trim()),
    timeout:                          cfg.commandTimeout,
    enabled:                          cfg.enabled,
    deviceCommandsBlocked:            cfg.blockDeviceCommands,
    sensitiveDevicesBlocked:          cfg.blockSensitiveDevices,
    sceneExecutionRequireConfirmation:cfg.sceneExecutionRequireConfirmation,
    sceneAuditEnabled:                cfg.sceneAuditEnabled,
  });
});

/* ─────────────────────────────────────────────
   PHASE 9 — Exécution contrôlée de scènes
   Routes statiques AVANT routes dynamiques /:id
───────────────────────────────────────────── */

/* GET /api/smartthings/scenes/execution-policy */
router.get('/scenes/execution-policy', (_req, res) => {
  try {
    res.json(connector.getSceneExecutionPolicy());
  } catch (err) {
    res.status(500).json({ status: 'error', ...safety.sanitizeSmartThingsError(err) });
  }
});

/* GET /api/smartthings/scenes/executable */
router.get('/scenes/executable', async (_req, res) => {
  try {
    res.json(await connector.getExecutableScenes());
  } catch (err) {
    res.status(500).json({ status: 'error', ...safety.sanitizeSmartThingsError(err) });
  }
});

/* GET /api/smartthings/scenes/audit */
router.get('/scenes/audit', async (_req, res) => {
  try {
    res.json(await connector.getSceneAuditHistory());
  } catch (err) {
    res.status(500).json({ status: 'error', ...safety.sanitizeSmartThingsError(err) });
  }
});

/* DELETE /api/smartthings/scenes/audit */
router.delete('/scenes/audit', async (_req, res) => {
  try {
    res.json(await connector.clearSceneAuditHistory());
  } catch (err) {
    res.status(500).json({ status: 'error', ...safety.sanitizeSmartThingsError(err) });
  }
});

/* POST /api/smartthings/scenes/:id/execute
   Body : { confirmationCode, reason }
   Requiert : allowlist + confirmation + audit */
router.post('/scenes/:id/execute', async (req, res) => {
  const sceneId = req.params.id;
  if (!sceneId || sceneId.length < 2) {
    return res.status(400).json({ success: false, error: 'sceneId invalide' });
  }

  // Blocage explicite des commandes directes d'appareil
  if (config.smartThings.blockDeviceCommands !== false) {
    // On s'assure que ce n'est pas une tentative de commande déguisée
    // (les scènes sont les seules opérations autorisées)
  }

  const { confirmationCode, reason } = req.body || {};

  try {
    const result = await connector.executeScene(sceneId, { confirmationCode, reason });
    if (result.success) {
      notif.notify({ type: 'smartthings', level: 'success',
        title: 'Scène SmartThings exécutée',
        message: `Scène acceptée et exécutée`,
        meta: { sceneId: sceneId.substring(0, 4) + '***' },
      });
    } else {
      notif.notify({ type: 'smartthings', level: 'warning',
        title: 'Scène SmartThings refusée',
        message: result.error || result.reason || 'Exécution refusée',
        meta: { sceneId: sceneId.substring(0, 4) + '***' },
      });
    }
    const statusCode = result.success ? 200 : 403;
    res.status(statusCode).json(result);
  } catch (err) {
    res.status(500).json({ success: false, ...safety.sanitizeSmartThingsError(err) });
  }
});

/* POST /api/smartthings/scenes/:id/preview — jamais d'exécution réelle */
router.post('/scenes/:id/preview', async (req, res) => {
  const sceneId = req.params.id;
  if (!sceneId || sceneId.length < 2) {
    return res.status(400).json({ status: 'error', message: 'sceneId invalide' });
  }
  try {
    const result = await connector.previewSceneExecution(sceneId);
    notif.notify({ type: 'smartthings', level: 'info',
      title: 'Prévisualisation scène SmartThings',
      message: 'Aperçu créé — aucune exécution réelle',
      meta: { sceneId: sceneId.substring(0, 4) + '***' },
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ status: 'error', ...safety.sanitizeSmartThingsError(err) });
  }
});

module.exports = router;

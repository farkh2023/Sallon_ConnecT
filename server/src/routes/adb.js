'use strict';
/* =============================================
   adb.js — Routes API ADB Phase 6
   Montées sur /api/adb dans server.js
   Lecture seule uniquement — aucune action destructive.
============================================= */

const express   = require('express');
const connector = require('../services/media/adbConnector');
const safety    = require('../services/media/adbSafety');

const router = express.Router();

/* GET /api/adb/status
   Retourne l'état ADB courant */
router.get('/status', async (_req, res) => {
  const status = await connector.getStatus();
  res.json({
    timestamp: new Date().toISOString(),
    ...status,
  });
});

/* GET /api/adb/devices
   Liste les appareils Android visibles — IDs masqués */
router.get('/devices', async (_req, res) => {
  const result = await connector.listDevices();
  res.json({
    timestamp: new Date().toISOString(),
    ...result,
  });
});

/* GET /api/adb/diagnostics
   Diagnostics complets de l'appareil Android (lecture seule) */
router.get('/diagnostics', async (_req, res) => {
  const result = await connector.getSafeDiagnostics();
  res.json({
    timestamp: new Date().toISOString(),
    ...result,
  });
});

/* POST /api/adb/refresh
   Relance une lecture ADB non destructive */
router.post('/refresh', async (_req, res) => {
  const result = await connector.getSafeDiagnostics();
  res.json({
    timestamp:  new Date().toISOString(),
    refreshed:  true,
    ...result,
  });
});

/* GET /api/adb/safety
   Retourne les informations de sécurité ADB */
router.get('/safety', (_req, res) => {
  res.json({
    timestamp:            new Date().toISOString(),
    readOnly:             true,
    sensitiveDataMasking: true,
    allowedCommands:      safety.ALLOWED_COMMANDS,
    blockedPatterns:      safety.BLOCKED_PATTERNS,
    note:                 'Toute commande non présente dans allowedCommands est refusée.',
  });
});

module.exports = router;

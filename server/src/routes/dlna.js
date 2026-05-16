'use strict';
/* =============================================
   dlna.js — Routes API DLNA Phase 7
   Montées sur /api/dlna dans server.js
   Découverte locale uniquement — aucune action de contrôle.
============================================= */

const express   = require('express');
const connector = require('../services/media/dlnaConnector');
const safety    = require('../services/media/dlnaSafety');
const config    = require('../services/config');

const router = express.Router();

/* GET /api/dlna/status */
router.get('/status', (_req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    ...connector.getStatus(),
  });
});

/* POST /api/dlna/discover
   Lance une découverte locale complète */
router.post('/discover', async (_req, res) => {
  const result = await connector.discoverDevices();
  res.json({
    timestamp: new Date().toISOString(),
    ...result,
  });
});

/* GET /api/dlna/devices
   Retourne les derniers appareils découverts (cache) */
router.get('/devices', (_req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    ...connector.getLastDiscovery(),
  });
});

/* GET /api/dlna/renderers */
router.get('/renderers', async (_req, res) => {
  const result = await connector.discoverRenderers();
  res.json({ timestamp: new Date().toISOString(), ...result });
});

/* GET /api/dlna/servers */
router.get('/servers', async (_req, res) => {
  const result = await connector.discoverMediaServers();
  res.json({ timestamp: new Date().toISOString(), ...result });
});

/* GET /api/dlna/players */
router.get('/players', async (_req, res) => {
  const result = await connector.discoverPlayers();
  res.json({ timestamp: new Date().toISOString(), ...result });
});

/* GET /api/dlna/safety */
router.get('/safety', (_req, res) => {
  res.json({
    timestamp:        new Date().toISOString(),
    readOnly:         true,
    localOnly:        true,
    ipMasking:        config.dlna.maskLocalIps,
    multicastTarget:  `${config.dlna.multicastAddress}:${config.dlna.multicastPort}`,
    timeout:          config.dlna.discoveryTimeout,
    maxResponses:     config.dlna.maxResponses,
    fetchDescriptions:config.dlna.fetchDescriptions,
    blockedActions:   safety.BLOCKED_ACTIONS,
    allowedFields:    safety.ALLOWED_DESC_FIELDS,
    note:             'Aucune action SOAP, aucun envoi de média, aucun contrôle TV.',
  });
});

/* DELETE /api/dlna/cache */
router.delete('/cache', (_req, res) => {
  connector.clearDiscoveryCache();
  res.json({ timestamp: new Date().toISOString(), cleared: true });
});

module.exports = router;

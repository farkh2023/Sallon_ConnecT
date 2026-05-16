'use strict';
/* =============================================
   routes/integrations.js — Endpoints /api/integrations/*
   Phase 7 : inclut statuts ADB et DLNA enrichis
============================================= */

const express      = require('express');
const router       = express.Router();
const registry     = require('../services/media/mediaRegistry');
const adbConnector = require('../services/media/adbConnector');
const dlnaConnector= require('../services/media/dlnaConnector');
const stConnector  = require('../services/media/smartThingsConnector');
const config       = require('../services/config');

/* GET /api/integrations/status */
router.get('/status', async (_req, res) => {
  const statuses     = registry.getAllStatuses();
  const capabilities = registry.getAllCapabilities();

  /* ADB — statut enrichi */
  let adbDetail = { status: statuses.adb, readOnly: true, available: false, masked: true, lastCheckedAt: null };
  try {
    const s = await adbConnector.getStatus();
    adbDetail = {
      status:        s.status,
      readOnly:      true,
      available:     s.available || false,
      masked:        process.env.ADB_MASK_DEVICE_ID !== 'false',
      lastCheckedAt: s.lastCheckedAt || null,
    };
  } catch { /* fallback silencieux */ }

  /* DLNA — statut enrichi depuis le cache (non bloquant) */
  const dlnaStatus = dlnaConnector.getStatus();
  const dlnaDetail = {
    status:         dlnaStatus.status,
    readOnly:       true,
    available:      dlnaStatus.available || false,
    lastDiscoveryAt:dlnaStatus.lastDiscoveryAt || null,
    deviceCount:    dlnaStatus.deviceCount    || 0,
    rendererCount:  dlnaStatus.rendererCount  || 0,
    serverCount:    dlnaStatus.serverCount    || 0,
    playerCount:    dlnaStatus.playerCount    || 0,
    masked:         process.env.DLNA_MASK_LOCAL_IPS !== 'false',
  };

  /* SmartThings — statut enrichi */
  let stDetail = {
    status: 'disabled', readOnly: true, available: false,
    tokenConfigured: false, locationConfigured: false, tvConfigured: false,
    sceneExecutionAllowed: false, masked: true, lastCheckedAt: null,
  };
  try {
    const s = await stConnector.getStatus();
    stDetail = {
      status:               s.status,
      readOnly:             true,
      available:            s.available || false,
      tokenConfigured:      s.tokenConfigured || false,
      locationConfigured:   s.locationConfigured || false,
      tvConfigured:         s.tvConfigured || false,
      sceneExecutionAllowed: false,
      masked:               config.smartThings.maskIds,
      lastCheckedAt:        s.lastCheckedAt || null,
    };
  } catch { /* fallback silencieux */ }

  res.json({
    timestamp:    new Date().toISOString(),
    statuses,
    capabilities,
    adb:          adbDetail,
    dlna:         dlnaDetail,
    smartThings:  stDetail,
    summary: {
      active: Object.values(statuses).filter(s => s === 'available' || s === 'ready').length,
      total:  Object.keys(statuses).length,
    },
  });
});

module.exports = router;

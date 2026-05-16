'use strict';
/* =============================================
   scenariosRuntime.js — Routes API scénarios Phase 5
   Montées sur /api/scenarios dans server.js
============================================= */

const express = require('express');
const engine  = require('../services/scenarios/scenarioEngine');

const router = express.Router();

/* GET /api/scenarios/runtime
   Retourne l'état de tous les scénarios exécutables */
router.get('/runtime', (_req, res) => {
  res.json(engine.getCurrentRuntime());
});

/* GET /api/scenarios/history
   Retourne l'historique local des exécutions */
router.get('/history', (_req, res) => {
  res.json({
    source:  'local',
    history: engine.getHistory(),
  });
});

/* DELETE /api/scenarios/history
   Vide l'historique local */
router.delete('/history', (_req, res) => {
  const result = engine.clearHistory();
  res.json(result);
});

/* POST /api/scenarios/:id/preview
   Retourne les étapes qui seraient exécutées sans rien lancer */
router.post('/:id/preview', (req, res) => {
  const result = engine.preview(req.params.id);
  if (result.error) return res.status(404).json(result);
  res.json(result);
});

/* POST /api/scenarios/:id/run
   Exécute le scénario — mode simulation par défaut */
router.post('/:id/run', (req, res) => {
  const mode   = (req.body && req.body.mode) || 'simulated';
  const result = engine.run(req.params.id, mode);

  if (result.error && result.hint) {
    return res.status(403).json(result);
  }
  if (result.error) {
    return res.status(404).json(result);
  }
  res.json(result);
});

/* POST /api/scenarios/:id/stop
   Arrête un scénario en cours si applicable */
router.post('/:id/stop', (req, res) => {
  const result = engine.stop(req.params.id);
  if (result.error) return res.status(404).json(result);
  res.json(result);
});

module.exports = router;

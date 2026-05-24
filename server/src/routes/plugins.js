'use strict';
/* =============================================
   plugins.js — Phase 43
   Plugins locaux extensibles — local-only.
   Aucun reseau, aucun secret, isolation erreurs.
============================================= */

const express        = require('express');
const router         = express.Router();
const registry       = require('../services/plugins/pluginRegistry');
const { getPluginSafety, sanitizePluginId } = require('../services/plugins/pluginSafety');

router.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

/* ── GET /api/plugins/safety ─────────────── */
router.get('/safety', (_req, res) => {
  res.json(getPluginSafety());
});

/* ── GET /api/plugins/list ───────────────── */
router.get('/list', (_req, res) => {
  try {
    const plugins = registry.listPlugins();
    res.json({ plugins, total: plugins.length });
  } catch {
    res.status(500).json({
      error:   'plugin_list_failed',
      message: 'Impossible de lister les plugins.',
    });
  }
});

/* ── POST /api/plugins/:id/enable ─────────── */
router.post('/:id/enable', (req, res) => {
  if (!sanitizePluginId(req.params.id)) {
    return res.status(400).json({
      error:   'invalid_plugin_id',
      message: 'ID de plugin invalide ou non autorise.',
    });
  }
  try {
    const result = registry.enablePlugin(req.params.id);
    if (!result.ok) {
      return res.status(400).json({ error: 'plugin_enable_failed', message: result.error });
    }
    res.json(result);
  } catch {
    res.status(500).json({ error: 'plugin_enable_failed', message: "Impossible d'activer le plugin." });
  }
});

/* ── POST /api/plugins/:id/disable ──────── */
router.post('/:id/disable', (req, res) => {
  if (!sanitizePluginId(req.params.id)) {
    return res.status(400).json({
      error:   'invalid_plugin_id',
      message: 'ID de plugin invalide ou non autorise.',
    });
  }
  try {
    const result = registry.disablePlugin(req.params.id);
    if (!result.ok) {
      return res.status(400).json({ error: 'plugin_disable_failed', message: result.error });
    }
    res.json(result);
  } catch {
    res.status(500).json({ error: 'plugin_disable_failed', message: 'Impossible de desactiver le plugin.' });
  }
});

module.exports = router;

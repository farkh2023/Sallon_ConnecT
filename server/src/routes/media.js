'use strict';
/* =============================================
   routes/media.js — Endpoints /api/media/*
============================================= */

const express  = require('express');
const fs       = require('fs');
const path     = require('path');
const router   = express.Router();
const registry = require('../services/media/mediaRegistry');

const DATA_DIR = path.join(__dirname, '../../../../data');

function readJson(filename) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, filename), 'utf8'));
}

/* GET /api/media/services */
router.get('/services', (_req, res) => {
  try {
    const services = readJson('media-services.json');
    /* Enrichit avec le statut live du connecteur correspondant */
    const statuses = registry.getAllStatuses();
    const enriched = services.map(s => ({
      ...s,
      connectorStatus: statuses[s.connector] || 'unknown',
    }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: 'Impossible de lire media-services.json', detail: err.message });
  }
});

/* GET /api/media/status */
router.get('/status', (_req, res) => {
  res.json(registry.getAllStatuses());
});

/* GET /api/media/playlists */
router.get('/playlists', (_req, res) => {
  try {
    res.json(readJson('media-playlists.json'));
  } catch (err) {
    res.status(500).json({ error: 'Impossible de lire media-playlists.json', detail: err.message });
  }
});

/* POST /api/media/youtube/preview
   Body: { url: "https://www.youtube.com/watch?v=..." }
   Ne télécharge rien — retourne uniquement l'embed URL légal */
router.post('/youtube/preview', (req, res) => {
  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: 'Champ "url" requis dans le body' });

  const result = registry.youtube.runPreview({ url });
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

/* POST /api/media/gallery/scan
   Scanne le dossier configuré dans MEDIA_LOCAL_GALLERY_PATH
   Retourne uniquement les noms de fichiers — jamais le contenu */
router.post('/gallery/scan', (_req, res) => {
  const result = registry.localGallery.runPreview();
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

module.exports = router;

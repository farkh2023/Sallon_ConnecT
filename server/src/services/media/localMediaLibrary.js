'use strict';
/* =============================================
   localMediaLibrary.js — Phase 11
   Registre local des médias autorisés.
   Scanne uniquement MEDIA_STREAMING_ALLOWED_DIR.
   Ne retourne jamais le chemin absolu complet.
   Ne modifie jamais les fichiers.
============================================= */

const fs     = require('fs');
const path   = require('path');
const config = require('../config');
const safety = require('./streamingSafety');

/* Cache en mémoire — jamais persisté sur disque */
let _cache = {
  items:      [],
  lastScanAt: null,
  status:     'not_scanned',
};

/* Génère un ID local non-sensible */
function generateMediaId(filename, index) {
  const base = path.basename(filename, path.extname(filename))
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 8)
    .toLowerCase();
  return `media-${index}-${base || 'file'}`;
}

/* ── getLibraryStatus ─────────────────────── */
function getLibraryStatus() {
  const cfg = config.streaming;
  if (!cfg || !cfg.enabled) {
    return { status: 'disabled', message: 'Streaming désactivé (MEDIA_STREAMING_ENABLED=false)', itemCount: 0 };
  }
  if (!cfg.allowedDir || !cfg.allowedDir.trim()) {
    return { status: 'not_configured', message: 'Dossier non configuré (MEDIA_STREAMING_ALLOWED_DIR vide)', itemCount: 0 };
  }
  return {
    status:       _cache.status,
    itemCount:    _cache.items.length,
    allowedDir:   '[dossier-configuré]',   // Jamais le chemin réel côté API
    lastScanAt:   _cache.lastScanAt,
    streamingEnabled: cfg.enabled,
    auditEnabled:     cfg.auditEnabled,
  };
}

/* ── scanAllowedDirectory ─────────────────── */
function scanAllowedDirectory() {
  const cfg = config.streaming;

  const configCheck = safety.validateStreamingConfig(config);
  if (!configCheck.valid) {
    return { status: 'error', items: [], message: configCheck.errors.join(', ') };
  }

  const dirCheck = safety.validateAllowedMediaDirectory(cfg.allowedDir);
  if (!dirCheck.valid) {
    return { status: 'error', items: [], message: dirCheck.reason };
  }

  try {
    const entries = fs.readdirSync(cfg.allowedDir, { withFileTypes: true });
    const items   = [];
    let index = 0;

    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;  // Skip hidden
      if (!entry.isFile()) continue;              // Skip subdirs

      const filePath = path.join(cfg.allowedDir, entry.name);

      const extCheck  = safety.validateMediaExtension(filePath, config);
      if (!extCheck.valid) continue;

      const sizeCheck = safety.validateMediaSize(filePath, config);
      if (!sizeCheck.valid) continue;

      const ext   = extCheck.ext;
      const type  = safety.getMediaType(ext);
      const title = path.basename(filePath, ext);
      const id    = generateMediaId(filePath, index++);

      items.push({
        id,
        title,
        type,
        extension:   ext,
        sizeMb:      sizeCheck.sizeMb,
        pathMasked:  safety.maskMediaPath(filePath),
        addedAt:     new Date().toISOString(),
        _absolutePath: filePath,  // Interne — jamais retourné au frontend
      });
    }

    _cache = {
      items,
      lastScanAt: new Date().toISOString(),
      status:     items.length > 0 ? 'available' : 'empty',
    };

    return {
      status:    _cache.status,
      itemCount: items.length,
      lastScanAt: _cache.lastScanAt,
    };
  } catch (err) {
    return { status: 'error', items: [], ...safety.sanitizeStreamingError(err) };
  }
}

/* ── listMediaItems ───────────────────────── */
function listMediaItems() {
  const cfg = config.streaming;
  if (!cfg || !cfg.enabled) {
    return { status: 'disabled', items: [], message: 'Streaming désactivé.' };
  }
  if (_cache.status === 'not_scanned') {
    return { status: 'not_scanned', items: [], message: 'Bibliothèque non scannée. Cliquez "Scanner médiathèque".' };
  }

  const items = _cache.items.map(safety.sanitizeMediaItem);

  return {
    status:    _cache.status,
    count:     items.length,
    items,
    lastScanAt: _cache.lastScanAt,
  };
}

/* ── getMediaItemById (usage interne) ──────── */
function getMediaItemById(id) {
  return _cache.items.find(item => item.id === id) || null;
}

/* ── refreshLibrary ───────────────────────── */
function refreshLibrary() {
  return scanAllowedDirectory();
}

/* ── clearLibraryCache ────────────────────── */
function clearLibraryCache() {
  _cache = { items: [], lastScanAt: null, status: 'not_scanned' };
  return { status: 'cleared', message: 'Cache médiathèque vidé.' };
}

module.exports = {
  getLibraryStatus,
  scanAllowedDirectory,
  listMediaItems,
  getMediaItemById,
  refreshLibrary,
  clearLibraryCache,
};

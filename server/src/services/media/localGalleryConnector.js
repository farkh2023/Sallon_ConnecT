'use strict';
/* =============================================
   localGalleryConnector.js
   Scan d'un dossier local d'images configuré dans .env
   Ne lit que les métadonnées — jamais le contenu binaire
============================================= */

const fs   = require('fs');
const path = require('path');
const config = require('../config');

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.avif']);
const MAX_FILES = 100;

function getStatus() {
  const { enabled, path: galleryPath } = config.media.localGallery;
  if (!enabled)      return 'disabled';
  if (!galleryPath)  return 'unconfigured';
  if (!fs.existsSync(path.resolve(galleryPath))) return 'error';
  return 'available';
}

function getCapabilities() {
  if (getStatus() !== 'available') return [];
  return ['scan', 'list-filenames'];
}

/* Retourne la liste des fichiers image (noms uniquement) */
function runPreview() {
  const { enabled, path: galleryPath } = config.media.localGallery;

  if (!enabled) {
    return { error: 'Galerie locale désactivée (MEDIA_LOCAL_GALLERY_ENABLED=false)', files: [] };
  }
  if (!galleryPath) {
    return { error: 'Galerie locale non configurée — renseigner MEDIA_LOCAL_GALLERY_PATH dans .env', files: [] };
  }

  const basePath = path.resolve(galleryPath);
  if (!fs.existsSync(basePath)) {
    return { error: `Dossier introuvable : ${basePath}`, files: [] };
  }

  let entries;
  try {
    entries = fs.readdirSync(basePath, { withFileTypes: true });
  } catch (err) {
    return { error: `Lecture impossible : ${err.message}`, files: [] };
  }

  const files = entries
    .filter(e => e.isFile() && IMAGE_EXTENSIONS.has(path.extname(e.name).toLowerCase()))
    .slice(0, MAX_FILES)
    .map(e => ({ name: e.name, ext: path.extname(e.name).toLowerCase() }));

  return { count: files.length, files };
}

module.exports = { getStatus, getCapabilities, runPreview };

'use strict';
/* =============================================
   youtubeConnector.js
   Embed YouTube légal — aucune clé API requise
============================================= */

const config = require('../config');

/* Extrait l'ID vidéo depuis une URL YouTube publique */
function extractVideoId(url) {
  if (!url || typeof url !== 'string') return null;
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /embed\/([a-zA-Z0-9_-]{11})/,
    /shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

function getStatus() {
  return config.media.youtube.embedEnabled ? 'available' : 'disabled';
}

function getCapabilities() {
  if (!config.media.youtube.embedEnabled) return [];
  return ['embed', 'preview', 'thumbnail'];
}

/* Retourne un objet sûr à afficher côté frontend */
function runPreview({ url } = {}) {
  if (!config.media.youtube.embedEnabled) {
    return { error: 'YouTube embed désactivé (YOUTUBE_EMBED_ENABLED=false)' };
  }
  const videoId = extractVideoId(url);
  if (!videoId) {
    return { error: 'URL YouTube invalide ou non reconnue' };
  }
  return {
    videoId,
    embedUrl:      `https://www.youtube.com/embed/${videoId}`,
    thumbnailUrl:  `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    watchUrl:      `https://www.youtube.com/watch?v=${videoId}`,
  };
}

module.exports = { getStatus, getCapabilities, runPreview, extractVideoId };

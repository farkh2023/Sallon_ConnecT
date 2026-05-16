'use strict';
/* =============================================
   playQueue.js — Phase 11
   File de lecture locale (en mémoire + persistance JSON).
   Jamais de lecture automatique sans confirmation.
   Jamais de chemin absolu exposé.
============================================= */

const fs      = require('fs');
const path    = require('path');
const library = require('./localMediaLibrary');
const safety  = require('./streamingSafety');

const QUEUE_PATH = path.resolve('runtime/media-queue.json');

/* ── Persistance ──────────────────────────── */

function _loadFromDisk() {
  try {
    const raw = fs.readFileSync(QUEUE_PATH, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data.items) ? data.items : [];
  } catch {
    return [];
  }
}

function _saveToDisk(items) {
  try {
    fs.writeFileSync(QUEUE_PATH, JSON.stringify({ items, lastUpdatedAt: new Date().toISOString() }, null, 2), 'utf8');
  } catch {
    /* Silencieux — la file reste en mémoire */
  }
}

/* ── État en mémoire ──────────────────────── */

let _queue = _loadFromDisk();

function _generateQueueItemId(mediaId, index) {
  const ts = Date.now().toString(36).slice(-4);
  return `qi-${ts}-${index}-${(mediaId || 'x').slice(-4)}`;
}

/* ── getQueue ─────────────────────────────── */
function getQueue() {
  return _queue.map(item => {
    const { _absolutePath, ...safe } = item;
    return safe;
  });
}

/* ── addToQueue ───────────────────────────── */
function addToQueue(mediaId) {
  if (!mediaId || typeof mediaId !== 'string') {
    return { success: false, reason: 'mediaId invalide.' };
  }

  const mediaItem = library.getMediaItemById(mediaId);
  if (!mediaItem) {
    return { success: false, reason: 'Média introuvable dans la bibliothèque. Scannez d\'abord la médiathèque.' };
  }

  if (_queue.length >= 50) {
    return { success: false, reason: 'File de lecture pleine (50 éléments max).' };
  }

  const queueItemId = _generateQueueItemId(mediaId, _queue.length);

  const entry = {
    queueItemId,
    mediaId:    mediaItem.id,
    title:      mediaItem.title,
    type:       mediaItem.type,
    extension:  mediaItem.extension,
    sizeMb:     mediaItem.sizeMb,
    addedAt:    new Date().toISOString(),
    status:     'queued',
  };

  _queue.push(entry);
  _saveToDisk(_queue);

  return { success: true, queueItemId, title: entry.title, position: _queue.length };
}

/* ── removeFromQueue ──────────────────────── */
function removeFromQueue(queueItemId) {
  if (!queueItemId) return { success: false, reason: 'queueItemId manquant.' };

  const before = _queue.length;
  _queue = _queue.filter(item => item.queueItemId !== queueItemId);

  if (_queue.length === before) {
    return { success: false, reason: 'Élément introuvable dans la file.' };
  }

  _saveToDisk(_queue);
  return { success: true, removed: queueItemId, remaining: _queue.length };
}

/* ── clearQueue ───────────────────────────── */
function clearQueue() {
  const count = _queue.length;
  _queue = [];
  _saveToDisk(_queue);
  return { success: true, cleared: count };
}

/* ── moveQueueItem ────────────────────────── */
function moveQueueItem(queueItemId, direction) {
  const idx = _queue.findIndex(item => item.queueItemId === queueItemId);
  if (idx === -1) return { success: false, reason: 'Élément introuvable.' };

  if (direction === 'up' && idx === 0) {
    return { success: false, reason: 'Déjà en première position.' };
  }
  if (direction === 'down' && idx === _queue.length - 1) {
    return { success: false, reason: 'Déjà en dernière position.' };
  }

  const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
  [_queue[idx], _queue[swapIdx]] = [_queue[swapIdx], _queue[idx]];

  _saveToDisk(_queue);
  return { success: true, queueItemId, newPosition: swapIdx + 1 };
}

/* ── previewQueue ─────────────────────────── */
function previewQueue() {
  const items = getQueue();
  return {
    itemCount: items.length,
    items:     items.slice(0, 10),   // Aperçu des 10 premiers
    hasMore:   items.length > 10,
    note:      'Aucun fichier ne sera lu sans confirmation explicite.',
  };
}

/* ── getQueueSummary ──────────────────────── */
function getQueueSummary() {
  const byType = { video: 0, audio: 0, image: 0, unknown: 0 };
  let totalMb  = 0;

  for (const item of _queue) {
    const t = item.type || 'unknown';
    byType[t] = (byType[t] || 0) + 1;
    totalMb  += item.sizeMb || 0;
  }

  return {
    totalItems: _queue.length,
    byType,
    totalMb:    Math.round(totalMb * 10) / 10,
    isEmpty:    _queue.length === 0,
  };
}

module.exports = {
  getQueue,
  addToQueue,
  removeFromQueue,
  clearQueue,
  moveQueueItem,
  previewQueue,
  getQueueSummary,
};

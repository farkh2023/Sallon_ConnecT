'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const config = require('../services/config');
const store = require('./media-store');
const security = require('./media-security');
const types = require('./media-types');

const MAX_FILES = 5000;

function createMediaId(rootKind, relativePath) {
  const digest = crypto
    .createHash('sha256')
    .update(`${rootKind}:${relativePath.toLowerCase()}`)
    .digest('hex')
    .slice(0, 16);
  return `media_${digest}`;
}

function toPublicItem(item) {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    extension: item.extension,
    mimeType: item.mimeType,
    sizeBytes: item.sizeBytes,
    streamUrl: `/api/media/stream/${item.id}`,
    thumbnailUrl: `/api/media/thumbnail/${item.id}`,
  };
}

function scanRoot(rootPath, rootKind, items, warnings) {
  if (!rootPath || !rootPath.trim()) return;
  const resolvedRoot = path.resolve(rootPath);

  let rootStat;
  try {
    rootStat = fs.statSync(resolvedRoot);
  } catch {
    warnings.push(`${rootKind} root is unavailable.`);
    return;
  }
  if (!rootStat.isDirectory()) {
    warnings.push(`${rootKind} root is not a directory.`);
    return;
  }

  const pending = [resolvedRoot];
  while (pending.length && items.length < MAX_FILES) {
    const current = pending.pop();
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      warnings.push(`${rootKind} contains an unreadable directory.`);
      continue;
    }

    for (const entry of entries) {
      if (items.length >= MAX_FILES) break;
      if (entry.name.startsWith('.')) continue;

      const absolutePath = path.join(current, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        pending.push(absolutePath);
        continue;
      }
      if (!entry.isFile()) continue;

      const validation = security.validateMediaPath(absolutePath, config);
      if (!validation.valid) continue;

      const type = types.getMediaType(validation.extension);
      if (!type) continue;

      let stat;
      try {
        // Stat the real path (validation.realFilePath) to avoid TOCTOU on the symlink
        stat = fs.statSync(validation.realFilePath);
      } catch {
        continue;
      }

      const relativePath = path.relative(resolvedRoot, absolutePath);
      items.push({
        id: createMediaId(rootKind, relativePath),
        type,
        title: path.basename(absolutePath),
        extension: validation.extension,
        mimeType: types.getMimeType(validation.extension),
        sizeBytes: stat.size,
        // Store the canonical path so stream-time checks are idempotent
        _absolutePath: validation.realFilePath,
      });
    }
  }
}

function rescan() {
  if (!config.realMedia.enabled) {
    store.replace([], ['Real media is disabled.']);
    return getLibrary();
  }

  const items = [];
  const warnings = [];
  scanRoot(config.realMedia.videoRoot, 'videos', items, warnings);
  scanRoot(config.realMedia.photoRoot, 'photos', items, warnings);
  store.replace(items, warnings);
  return getLibrary();
}

function ensureIndexed() {
  if (!store.getSnapshot().scanned) rescan();
}

function getLibrary() {
  ensureIndexed();
  const snapshot = store.getSnapshot();
  const items = store.getInternalItems().map(toPublicItem);
  return {
    ok: true,
    scanned: snapshot.scanned,
    scannedAt: snapshot.scannedAt,
    count: items.length,
    warnings: snapshot.warnings,
    items,
  };
}

function getByType(type) {
  const library = getLibrary();
  const items = library.items.filter(item => item.type === type);
  return { ...library, count: items.length, items };
}

module.exports = { createMediaId, toPublicItem, rescan, getLibrary, getByType };

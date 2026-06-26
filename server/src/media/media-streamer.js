'use strict';

const fs = require('fs');
const config = require('../services/config');
const store = require('./media-store');
const indexer = require('./media-indexer');
const security = require('./media-security');

function resolveMedia(mediaId) {
  indexer.getLibrary();
  const item = store.getById(mediaId);
  if (!item) return { error: { status: 404, message: 'Média introuvable.' } };

  // validateMediaPath now covers lexical check + extension + realpathSync.native
  const validation = security.validateMediaPath(item._absolutePath, config);
  if (!validation.valid) {
    return { error: { status: validation.status, message: validation.reason } };
  }

  try {
    const stat = fs.statSync(validation.realFilePath);
    if (!stat.isFile()) throw new Error('Not a file');
    return { item, stat, realFilePath: validation.realFilePath };
  } catch (error) {
    if (error && ['ENOENT', 'ENOTDIR'].includes(error.code)) {
      return { error: { status: 404, message: 'Fichier média introuvable.' } };
    }
    return { error: { status: 500, message: 'Erreur de lecture du média.' } };
  }
}

function handleReadStreamError(res, error) {
  if (res.headersSent) {
    res.destroy(error);
    return;
  }

  res.removeHeader('Content-Length');
  res.removeHeader('Content-Range');
  res.removeHeader('Accept-Ranges');
  res.removeHeader('Cache-Control');
  res.removeHeader('Content-Type');
  const status = error && ['ENOENT', 'ENOTDIR'].includes(error.code) ? 404 : 500;
  const message = status === 404 ? 'Fichier média introuvable.' : 'Erreur de lecture du média.';
  res.status(status).json({ ok: false, error: message });
}

function pipeMediaFile(res, filePath, options) {
  let readStream;
  try {
    readStream = fs.createReadStream(filePath, options);
  } catch (error) {
    handleReadStreamError(res, error);
    return null;
  }
  readStream.on('error', error => handleReadStreamError(res, error));
  readStream.pipe(res);
  return readStream;
}

function parseRange(rangeHeader, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(String(rangeHeader || '').trim());
  if (!match) return null;

  let start = match[1] ? Number(match[1]) : null;
  let end = match[2] ? Number(match[2]) : null;

  if (start === null && end !== null) {
    const suffixLength = Math.min(end, size);
    start = size - suffixLength;
    end = size - 1;
  } else {
    start = start ?? 0;
    end = end ?? size - 1;
  }

  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start || start >= size) {
    return null;
  }
  return { start, end: Math.min(end, size - 1) };
}

function stream(req, res) {
  const resolved = resolveMedia(req.params.mediaId);
  if (resolved.error) return res.status(resolved.error.status).json({ ok: false, error: resolved.error.message });

  const { item, stat, realFilePath } = resolved;
  const rangeHeader = req.headers.range;
  const useRange = item.type === 'video' && config.realMedia.rangeStreaming && rangeHeader;

  res.setHeader('Content-Type', item.mimeType);
  res.setHeader('Accept-Ranges', item.type === 'video' ? 'bytes' : 'none');
  res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');

  if (useRange) {
    const range = parseRange(rangeHeader, stat.size);
    if (!range) {
      res.setHeader('Content-Range', `bytes */${stat.size}`);
      return res.status(416).end();
    }
    const contentLength = range.end - range.start + 1;
    res.status(206);
    res.setHeader('Content-Range', `bytes ${range.start}-${range.end}/${stat.size}`);
    res.setHeader('Content-Length', contentLength);
    return pipeMediaFile(res, realFilePath, range);
  }

  res.status(200);
  res.setHeader('Content-Length', stat.size);
  return pipeMediaFile(res, realFilePath);
}

function thumbnail(req, res) {
  const resolved = resolveMedia(req.params.mediaId);
  if (resolved.error) return res.status(resolved.error.status).json({ ok: false, error: resolved.error.message });

  const { item, stat, realFilePath } = resolved;
  if (item.type === 'image') {
    res.status(200);
    res.setHeader('Content-Type', item.mimeType);
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Cache-Control', 'private, max-age=300');
    return pipeMediaFile(res, realFilePath);
  }

  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">',
    '<rect width="640" height="360" fill="#0f172a"/>',
    '<circle cx="320" cy="180" r="62" fill="#2563eb"/>',
    '<path d="M300 142 L300 218 L356 180 Z" fill="#fff"/>',
    '<text x="320" y="285" text-anchor="middle" fill="#94a3b8" font-family="Arial" font-size="22">Aperçu vidéo local</text>',
    '</svg>',
  ].join('');
  res.status(200).type('image/svg+xml').setHeader('Cache-Control', 'private, max-age=300');
  return res.send(svg);
}

module.exports = {
  resolveMedia,
  parseRange,
  handleReadStreamError,
  pipeMediaFile,
  stream,
  thumbnail,
};

'use strict';

const fs   = require('fs');
const path = require('path');
const workspaceContext = require('../../workspaces/workspaceContext');

const RAG_DIR = path.join(process.cwd(), 'runtime', 'rag');

function getRagDir(options = {}) {
  return workspaceContext.getRagPath(options.workspaceId);
}

function ensureDir(options = {}) {
  const dir = getRagDir(options);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function ragPath(name, options = {}) {
  return path.join(getRagDir(options), `${name}.json`);
}

function readJson(name, fallback, options = {}) {
  try {
    const p = ragPath(name, options);
    if (!fs.existsSync(p)) return fallback;
    const raw = fs.readFileSync(p, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(name, data, options = {}) {
  ensureDir(options);
  fs.writeFileSync(ragPath(name, options), JSON.stringify(data, null, 2), 'utf8');
}

function getIndex(options)    { return readJson('index',    null, options); }
function getChunks(options)   { return readJson('chunks',   [],   options); }
function getMetadata(options) { return readJson('metadata', null, options); }

function saveIndex(data, options)    { writeJson('index',    data, options); }
function saveChunks(data, options)   { writeJson('chunks',   data, options); }
function saveMetadata(data, options) { writeJson('metadata', data, options); }

function clearAll(options) {
  ensureDir(options);
  for (const name of ['index', 'chunks', 'metadata']) {
    const p = ragPath(name, options);
    try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch { /* ignore */ }
  }
}

function isIndexed(options) {
  const idx = getIndex(options);
  return idx !== null && typeof idx.chunkCount === 'number' && idx.chunkCount > 0;
}

function getStatus(options = {}) {
  const ctx  = workspaceContext.getContextPaths(options.workspaceId);
  const idx  = getIndex(options);
  const meta = getMetadata(options);
  if (!idx) {
    return { indexed: false, chunkCount: 0, sources: [], mode: null, indexedAt: null, workspaceId: ctx.workspaceId };
  }
  return {
    workspaceId:      ctx.workspaceId,
    indexed:        true,
    chunkCount:     idx.chunkCount   || 0,
    sources:        idx.sources      || [],
    mode:           idx.mode         || 'lexical',
    embeddingModel: idx.embeddingModel || null,
    indexedAt:      idx.indexedAt    || null,
    checksum:       idx.checksum     || null,
    ragVersion:     meta?.ragVersion || null,
  };
}

module.exports = {
  getIndex, getChunks, getMetadata,
  saveIndex, saveChunks, saveMetadata,
  clearAll, isIndexed, getStatus,
  getRagDir,
  RAG_DIR,
};

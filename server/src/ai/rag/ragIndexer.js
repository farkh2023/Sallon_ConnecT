'use strict';

const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

const { isSourceAllowed, isFileSizeAllowed, maskSourceContent } = require('./ragSafety');
const { chunkMarkdown }                                          = require('./ragChunker');
const { getEmbedding, EMBEDDING_MODEL }                          = require('./ragEmbeddings');
const { saveIndex, saveChunks, saveMetadata }                    = require('./ragStore');

// Sources statiques a indexer en priorite
const STATIC_SOURCES = ['README.md', 'CHANGELOG.md', 'ROADMAP.md'];

/**
 * Parcourt recurssivement le dossier docs/ et retourne les chemins relatifs autorises.
 */
function collectDocFiles(baseDir) {
  const docsPath = path.join(baseDir, 'docs');
  if (!fs.existsSync(docsPath)) return [];
  const files = [];
  function walk(dir, rel) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const relPath = (rel ? rel + '/' : '') + entry.name;
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name), relPath);
      } else if (entry.isFile() && isSourceAllowed(relPath)) {
        files.push(relPath);
      }
    }
  }
  walk(docsPath, 'docs');
  return files;
}

/**
 * Indexe toutes les sources autorisees.
 * Tente les embeddings Ollama ; fallback lexical si indisponibles.
 */
async function indexSources(options = {}) {
  const baseDir    = options.baseDir || process.cwd();
  const storeOptions = options.workspaceId ? { workspaceId: options.workspaceId } : undefined;
  const docFiles   = collectDocFiles(baseDir);
  const allRelPaths = [...STATIC_SOURCES, ...docFiles];
  const uniquePaths = [...new Set(allRelPaths)].filter(isSourceAllowed);

  const allChunks      = [];
  const indexedSources = [];
  let embeddingsFailed = false;

  for (const relPath of uniquePaths) {
    const absPath = path.join(baseDir, relPath);
    if (!fs.existsSync(absPath)) continue;
    let stat;
    try { stat = fs.statSync(absPath); } catch { continue; }
    if (!isFileSizeAllowed(stat.size)) continue;

    let raw;
    try { raw = fs.readFileSync(absPath, 'utf8'); } catch { continue; }

    const content    = maskSourceContent(raw);
    const fileChunks = chunkMarkdown(content, relPath);
    if (fileChunks.length === 0) continue;

    // Tentative embeddings
    if (!embeddingsFailed) {
      for (const chunk of fileChunks) {
        try {
          chunk.embedding = await getEmbedding(chunk.text);
        } catch {
          embeddingsFailed = true;
          chunk.embedding  = null;
        }
      }
    }

    allChunks.push(...fileChunks);
    indexedSources.push({
      path:   relPath,
      chunks: fileChunks.length,
      size:   stat.size,
    });
  }

  const hasEmbeddings = !embeddingsFailed && allChunks.some(c => Array.isArray(c.embedding) && c.embedding.length > 0);
  const mode          = hasEmbeddings ? 'embedding' : 'lexical';
  const now           = new Date().toISOString();
  const checksum      = crypto.createHash('sha256')
    .update(JSON.stringify(allChunks.map(c => c.hash)))
    .digest('hex')
    .slice(0, 16);

  const indexData = {
    version:        '1.0',
    indexedAt:      now,
    chunkCount:     allChunks.length,
    sources:        indexedSources,
    mode,
    embeddingModel: mode === 'embedding' ? EMBEDDING_MODEL : null,
    checksum,
  };

  const metadata = {
    ...indexData,
    ragVersion:   '46',
    totalFiles:   uniquePaths.length,
    indexedFiles: indexedSources.length,
  };

  saveIndex(indexData, storeOptions);
  saveChunks(allChunks, storeOptions);
  saveMetadata(metadata, storeOptions);

  return { ok: true, ...indexData };
}

module.exports = { indexSources, collectDocFiles, STATIC_SOURCES };

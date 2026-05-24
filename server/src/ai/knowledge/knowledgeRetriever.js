'use strict';

const http = require('http');
const { getIndex, buildTokens } = require('./knowledgeIndexer');
const { sanitizeForCitation }   = require('./knowledgeSafety');

function scoreEntry(entry, queryTokens) {
  let score = 0;
  const { tokens, item } = entry;
  for (const qt of queryTokens) {
    if (tokens.includes(qt)) score += 2;
    else if (tokens.some(t => t.includes(qt))) score += 1;
  }
  score += (item.importance || 1) * 0.1;
  return score;
}

function applyFilters(item, filters = {}) {
  if (filters.type   && item.type   !== filters.type)   return false;
  if (filters.source && item.sourceId !== filters.source) return false;
  if (filters.tag    && !(item.tags || []).includes(filters.tag)) return false;
  if (filters.entity && !(item.entities || []).includes(filters.entity)) return false;
  return true;
}

function searchLexical(query, filters = {}, topK = 8, options = {}) {
  const queryTokens = buildTokens(query);
  if (queryTokens.length === 0) return [];

  const idx = getIndex(options);
  const scored = [];

  for (const [, entry] of idx) {
    if (!applyFilters(entry.item, filters)) continue;
    const score = scoreEntry(entry, queryTokens);
    if (score > 0) scored.push({ ...entry.item, _score: score });
  }

  return scored
    .sort((a, b) => b._score - a._score)
    .slice(0, topK)
    .map(item => ({ ...item, _citation: sanitizeForCitation(item) }));
}

function _ollamaEmbedding(model, text) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ model, prompt: text });
    const req  = http.request(
      { hostname: '127.0.0.1', port: 11434, path: '/api/embeddings', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
      res => {
        let data = '';
        res.on('data', d => { data += d; });
        res.on('end', () => {
          try { resolve(JSON.parse(data).embedding || []); }
          catch { reject(new Error('embedding_parse_error')); }
        });
      }
    );
    req.setTimeout(5000, () => { req.destroy(); reject(new Error('embedding_timeout')); });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function cosineSim(a, b) {
  if (!a.length || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] ** 2; nb += b[i] ** 2; }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}

async function searchWithEmbeddings(query, filters = {}, topK = 8, options = {}) {
  const enabled = process.env.SALLON_KNOWLEDGE_EMBEDDINGS_ENABLED === 'true';
  if (!enabled) return searchLexical(query, filters, topK, options);

  try {
    const model   = process.env.SALLON_KNOWLEDGE_EMBEDDING_MODEL || 'nomic-embed-text';
    const queryVec = await _ollamaEmbedding(model, query);
    const idx      = getIndex(options);
    const scored   = [];

    for (const [, entry] of idx) {
      if (!applyFilters(entry.item, filters)) continue;
      const vec = entry.item._embedding;
      const sim = vec ? cosineSim(queryVec, vec) : 0;
      if (sim > 0.3 || sim === 0) {
        const lexScore = scoreEntry(entry, buildTokens(query));
        scored.push({ ...entry.item, _score: sim * 10 + lexScore });
      }
    }

    return scored
      .sort((a, b) => b._score - a._score)
      .slice(0, topK)
      .map(item => ({ ...item, _citation: sanitizeForCitation(item) }));
  } catch {
    return searchLexical(query, filters, topK, options);
  }
}

module.exports = { searchLexical, searchWithEmbeddings };

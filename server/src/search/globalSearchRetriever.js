'use strict';

const { getIndex, tokenize } = require('./globalSearchIndexer');
const { sanitizeResult }     = require('./globalSearchSafety');
const { TOP_K }              = require('./globalSearchTypes');

function scoreEntry(entry, queryTokens) {
  let score = entry.score || 0;
  const tokens = entry._tokens || [];
  for (const qt of queryTokens) {
    if (tokens.includes(qt))                    score += 2;
    else if (tokens.some(t => t.includes(qt)))  score += 1;
  }
  return score;
}

function groupByType(results) {
  const groups = {};
  for (const r of results) {
    if (!groups[r.type]) groups[r.type] = [];
    groups[r.type].push(r);
  }
  return groups;
}

function search(query, filters = {}, topK, options = {}) {
  const k           = topK || TOP_K();
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return { results: [], groups: {}, total: 0 };

  const idx    = getIndex(options);
  const scored = [];

  for (const entry of idx) {
    if (filters.type && entry.type !== filters.type) continue;
    const score = scoreEntry(entry, queryTokens);
    if (score > 0) {
      const clean = sanitizeResult({ ...entry, score });
      delete clean._tokens;
      scored.push(clean);
    }
  }

  scored.sort((a, b) => b.score - a.score);
  const results = scored.slice(0, k);
  return { results, groups: groupByType(results), total: results.length };
}

// Ollama-powered query suggestions (best-effort, no obligation)
const http = require('http');

async function suggestQuery(query) {
  return new Promise(resolve => {
    const body = JSON.stringify({
      model:       process.env.SALLON_OLLAMA_MODEL || 'mistral',
      prompt:      `Reformule cette requete de recherche en 5 mots maximum : "${query}"`,
      stream:      false,
      num_predict: 20,
    });
    const req = http.request(
      { hostname: '127.0.0.1', port: 11434, path: '/api/generate', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
      res => {
        let data = '';
        res.on('data', d => { data += d; });
        res.on('end', () => {
          try { resolve(JSON.parse(data).response?.trim() || null); }
          catch { resolve(null); }
        });
      }
    );
    req.setTimeout(5000, () => { req.destroy(); resolve(null); });
    req.on('error', () => resolve(null));
    req.write(body);
    req.end();
  });
}

module.exports = { search, suggestQuery };

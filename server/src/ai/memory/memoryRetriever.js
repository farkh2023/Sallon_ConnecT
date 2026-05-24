'use strict';

const { listItems }                    = require('./memoryStore');
const { buildSearchTokens, indexItems, scoreItem } = require('./memoryIndexer');

const MAX_RESULTS = 50;

function searchLexical(query, filters = {}, topK = 10) {
  const queryTokens = buildSearchTokens(query);
  const safeTopK    = Math.min(Math.max(1, topK), MAX_RESULTS);

  if (queryTokens.length === 0) {
    return listItems(filters).slice(0, safeTopK);
  }

  const items   = listItems(filters);
  const itemMap = new Map(items.map(i => [i.id, i]));
  const indexed = indexItems().filter(e => itemMap.has(e.id));

  return indexed
    .map(e => ({ id: e.id, score: scoreItem(e, queryTokens) }))
    .filter(e => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, safeTopK)
    .map(e => ({ ...itemMap.get(e.id), _score: e.score }));
}

async function searchWithEmbeddings(query, filters = {}, topK = 10) {
  if (process.env.SALLON_AI_MEMORY_EMBEDDINGS_ENABLED !== 'true') {
    return searchLexical(query, filters, topK);
  }
  try {
    const fetch = (await import('node-fetch')).default;
    const res   = await fetch('http://127.0.0.1:11434/api/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        model:  process.env.SALLON_EMBED_MODEL || 'nomic-embed-text',
        prompt: query,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error('ollama_embed_unavailable');
    // Vecteur reçu mais index vectoriel non implémenté — fallback lexical
    return searchLexical(query, filters, topK);
  } catch {
    return searchLexical(query, filters, topK);
  }
}

module.exports = { searchLexical, searchWithEmbeddings };

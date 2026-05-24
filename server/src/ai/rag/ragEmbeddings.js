'use strict';

const { isLocalUrl } = require('../aiSafety');

const EMBEDDING_MODEL = process.env.SALLON_RAG_EMBEDDING_MODEL || 'nomic-embed-text';
const TIMEOUT_MS      = parseInt(process.env.SALLON_AI_TIMEOUT_MS || '30000', 10);

function getOllamaUrl() {
  return process.env.SALLON_OLLAMA_URL || 'http://127.0.0.1:11434';
}

/**
 * Obtient l'embedding d'un texte via Ollama local.
 * Lance une erreur si Ollama est indisponible (le caller doit catcher).
 */
async function getEmbedding(text) {
  const url = getOllamaUrl();
  if (!isLocalUrl(url)) throw new Error('url_ollama_non_locale');
  if (typeof text !== 'string' || !text.trim()) throw new Error('text_vide');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.min(TIMEOUT_MS, 15000));
  try {
    const res = await fetch(`${url}/api/embeddings`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ model: EMBEDDING_MODEL, prompt: text }),
      signal:  controller.signal,
    });
    if (!res.ok) throw new Error(`ollama_embeddings_http_${res.status}`);
    const data = await res.json();
    const embedding = data.embedding;
    if (!Array.isArray(embedding) || embedding.length === 0) throw new Error('embedding_vide');
    return embedding;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Score lexical simple : ratio de tokens de la question presents dans le texte.
 */
function lexicalScore(query, text) {
  if (typeof query !== 'string' || typeof text !== 'string') return 0;
  const tokens = query.toLowerCase().split(/\W+/).filter(t => t.length >= 3);
  if (tokens.length === 0) return 0;
  const lower = text.toLowerCase();
  let hits = 0;
  for (const token of tokens) {
    if (lower.includes(token)) hits++;
  }
  return hits / tokens.length;
}

/**
 * Similarite cosinus entre deux vecteurs.
 */
function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

module.exports = {
  getEmbedding,
  lexicalScore,
  cosineSimilarity,
  EMBEDDING_MODEL,
  getOllamaUrl,
};

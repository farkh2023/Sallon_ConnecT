'use strict';

const { getChunks, getIndex } = require('./ragStore');
const { getEmbedding, lexicalScore, cosineSimilarity } = require('./ragEmbeddings');

const DEFAULT_TOP_K = parseInt(process.env.SALLON_RAG_TOP_K || '5', 10);

/**
 * Retrouve les chunks les plus pertinents pour une question.
 * Utilise les embeddings vectoriels si disponibles, sinon fallback lexical.
 */
async function retrieve(question, options = {}) {
  const topK   = (typeof options.topK === 'number' && options.topK > 0) ? options.topK : DEFAULT_TOP_K;
  const storeOptions = options.workspaceId ? { workspaceId: options.workspaceId } : undefined;
  const index  = getIndex(storeOptions);
  const chunks = getChunks(storeOptions);

  if (!Array.isArray(chunks) || chunks.length === 0) {
    return { chunks: [], mode: 'empty', indexed: false };
  }

  const usedEmbeddings = index?.mode === 'embedding';

  // Tentative retrieval vectoriel
  if (usedEmbeddings) {
    try {
      const queryEmbedding = await getEmbedding(question);
      if (queryEmbedding) {
        const scored = chunks
          .filter(c => Array.isArray(c.embedding) && c.embedding.length > 0)
          .map(c => ({ ...c, _score: cosineSimilarity(queryEmbedding, c.embedding) }))
          .sort((a, b) => b._score - a._score)
          .slice(0, topK);
        return { chunks: scored, mode: 'embedding', indexed: true };
      }
    } catch {
      // Fallback lexical si embeddings indisponibles
    }
  }

  // Fallback lexical
  const scored = chunks
    .map(c => ({ ...c, _score: lexicalScore(question, c.text) }))
    .filter(c => c._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, topK);

  // Si aucun resultat lexical, retourner les premiers chunks
  if (scored.length === 0) {
    return {
      chunks: chunks.slice(0, topK).map(c => ({ ...c, _score: 0 })),
      mode: 'lexical',
      indexed: true,
    };
  }

  return { chunks: scored, mode: 'lexical', indexed: true };
}

module.exports = { retrieve, DEFAULT_TOP_K };

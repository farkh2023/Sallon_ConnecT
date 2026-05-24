'use strict';

const { maskCitationPath } = require('./ragSafety');

/**
 * Formate les citations a partir des chunks retrouves.
 * Aucun chemin absolu ni donnee sensible n'est revele.
 */
function formatCitations(chunks) {
  if (!Array.isArray(chunks)) return [];
  return chunks.map((chunk, i) => ({
    index:   i + 1,
    source:  maskCitationPath(chunk.source || ''),
    heading: chunk.heading || '',
    excerpt: (chunk.text || '').slice(0, 200).trim(),
    score:   typeof chunk._score === 'number' ? Math.round(chunk._score * 1000) / 1000 : null,
  }));
}

/**
 * Construit le bloc de contexte documentaire pour le prompt.
 * Limite chaque chunk a 800 caracteres pour controler la taille.
 */
function buildContextBlock(chunks) {
  if (!Array.isArray(chunks) || chunks.length === 0) return '';
  return chunks.map((chunk, i) => {
    const src     = maskCitationPath(chunk.source || '');
    const heading = chunk.heading ? ` > ${chunk.heading}` : '';
    const text    = (chunk.text || '').slice(0, 800);
    return `[Source ${i + 1}: ${src}${heading}]\n${text}`;
  }).join('\n\n---\n\n');
}

module.exports = { formatCitations, buildContextBlock };

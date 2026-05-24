'use strict';

const crypto = require('crypto');

const DEFAULT_CHUNK_SIZE    = parseInt(process.env.SALLON_RAG_CHUNK_SIZE    || '1200', 10);
const DEFAULT_CHUNK_OVERLAP = parseInt(process.env.SALLON_RAG_CHUNK_OVERLAP || '150',  10);

/**
 * Decoupe un texte Markdown en chunks par titre H1-H6.
 * Sections trop longues sont subdivisees avec overlap.
 */
function chunkMarkdown(content, filePath, options = {}) {
  if (typeof content !== 'string' || !content.trim()) return [];

  const chunkSize    = options.chunkSize    || DEFAULT_CHUNK_SIZE;
  const chunkOverlap = options.chunkOverlap || DEFAULT_CHUNK_OVERLAP;
  const indexedAt    = new Date().toISOString();
  const chunks       = [];

  // Séparer par titres Markdown (garde le titre dans la section)
  const sections = content.split(/(?=\n#{1,6}\s)/);

  let lineOffset = 0;
  for (const section of sections) {
    if (!section.trim()) {
      lineOffset += section.split('\n').length;
      continue;
    }

    const headingMatch = section.match(/^#{1,6}\s+(.+)/m);
    const heading = headingMatch ? headingMatch[1].trim() : '';
    const sectionLines = section.split('\n').length;

    if (section.length <= chunkSize) {
      chunks.push(makeChunk(section, filePath, heading, lineOffset + 1, lineOffset + sectionLines, indexedAt));
    } else {
      let start = 0;
      let linePos = lineOffset;
      while (start < section.length) {
        const end  = Math.min(start + chunkSize, section.length);
        const text = section.slice(start, end);
        const textLines = text.split('\n').length;
        chunks.push(makeChunk(text, filePath, heading, linePos + 1, linePos + textLines, indexedAt));
        if (end >= section.length) break;
        start   = end - chunkOverlap;
        linePos = lineOffset + section.slice(0, start).split('\n').length;
      }
    }

    lineOffset += sectionLines;
  }

  return chunks;
}

function makeChunk(text, filePath, heading, lineStart, lineEnd, indexedAt) {
  const trimmed = typeof text === 'string' ? text.trim() : '';
  const hash = crypto.createHash('sha256').update(trimmed).digest('hex').slice(0, 16);
  return {
    id:        `chunk_${hash}`,
    text:      trimmed,
    source:    filePath || '',
    heading:   heading  || '',
    lineStart: lineStart || 0,
    lineEnd:   lineEnd   || 0,
    hash,
    indexedAt: indexedAt || new Date().toISOString(),
    embedding: null,
  };
}

module.exports = {
  chunkMarkdown,
  makeChunk,
  DEFAULT_CHUNK_SIZE,
  DEFAULT_CHUNK_OVERLAP,
};

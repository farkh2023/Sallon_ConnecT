'use strict';

const { getAllItems } = require('./memoryStore');

function buildSearchTokens(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);
}

function indexItems() {
  return getAllItems().map(item => ({
    id:         item.id,
    importance: item.importance || 0,
    tokens:     [
      ...buildSearchTokens(item.content),
      ...buildSearchTokens((item.tags || []).join(' ')),
      ...buildSearchTokens(item.type),
      ...buildSearchTokens(item.scope),
    ],
  }));
}

function scoreItem(entry, queryTokens) {
  let score = 0;
  for (const qt of queryTokens) {
    for (const it of entry.tokens) {
      if (it === qt)                        score += 2;
      else if (it.includes(qt) || qt.includes(it)) score += 1;
    }
  }
  return score + (entry.importance || 0) * 0.1;
}

module.exports = { buildSearchTokens, indexItems, scoreItem };

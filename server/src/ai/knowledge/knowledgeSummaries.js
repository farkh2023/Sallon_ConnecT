'use strict';

const http  = require('http');
const store = require('./knowledgeStore');
const { maskSecrets } = require('./knowledgeSafety');

const CATEGORIES = ['project', 'workflows', 'memory', 'diagnostics', 'agents', 'plugins'];

const TYPE_MAP = {
  project:     ['note', 'rag'],
  workflows:   ['workflow'],
  memory:      ['memory'],
  diagnostics: ['diagnostic'],
  agents:      ['agent'],
  plugins:     ['plugin'],
};

function extractiveSummary(items, maxChars = 1200) {
  const chunks = items
    .sort((a, b) => (b.importance || 1) - (a.importance || 1))
    .slice(0, 10)
    .map(i => maskSecrets(i.content || '').slice(0, 300));

  let combined = chunks.join(' ').slice(0, maxChars);
  return combined || 'Aucun contenu disponible.';
}

function _ollamaGenerate(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model:       process.env.SALLON_OLLAMA_MODEL || 'mistral',
      prompt,
      stream:      false,
      num_predict: 150,
    });
    const req = http.request(
      { hostname: '127.0.0.1', port: 11434, path: '/api/generate', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
      res => {
        let data = '';
        res.on('data', d => { data += d; });
        res.on('end', () => {
          try { resolve(JSON.parse(data).response || ''); }
          catch { reject(new Error('ollama_parse_error')); }
        });
      }
    );
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('ollama_timeout')); });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function summarizeCategory(category, options = {}) {
  const types = TYPE_MAP[category];
  if (!types) throw new Error(`categorie_inconnue: ${category}`);

  const items = store.getAllItems(options).filter(i => types.includes(i.type));
  if (items.length === 0) {
    return { category, summary: 'Aucun element dans cette categorie.', method: 'empty', items: 0 };
  }

  const text = extractiveSummary(items);
  const prompt = `Resumes en 3 phrases maximum les informations suivantes sur "${category}" d'un projet local:\n\n${text}`;

  try {
    const summary = await _ollamaGenerate(prompt);
    return { category, summary: summary.trim(), method: 'ai', items: items.length };
  } catch {
    return { category, summary: text, method: 'extractive', items: items.length };
  }
}

async function summarizeAll(options = {}) {
  const results = {};
  for (const cat of CATEGORIES) {
    try { results[cat] = await summarizeCategory(cat, options); }
    catch (e) { results[cat] = { category: cat, summary: e.message, method: 'error', items: 0 }; }
  }
  return results;
}

module.exports = { CATEGORIES, summarizeCategory, summarizeAll, extractiveSummary };

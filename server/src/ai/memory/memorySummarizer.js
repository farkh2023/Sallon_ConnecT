'use strict';

const { maskSecretPatterns } = require('./memorySafety');

const MAX_COMBINED_CHARS = 3000;

async function summarizeItems(items, options = {}) {
  const { useAi = true } = options;

  if (!items || items.length === 0) return { summary: '', method: 'empty' };

  const combined = items
    .map(i => `[${i.type}/${i.scope}] ${maskSecretPatterns(i.content || '')}`)
    .join('\n')
    .slice(0, MAX_COMBINED_CHARS);

  if (!combined.trim()) return { summary: '', method: 'empty' };

  if (useAi && process.env.SALLON_AI_ENABLED === 'true') {
    try {
      const fetch = (await import('node-fetch')).default;
      const model  = process.env.SALLON_AI_MODEL || 'qwen2.5:7b';
      const prompt = `Resume en 3 a 5 phrases concises les elements suivants de la memoire locale. Ne pas mentionner de secrets, tokens, chemins personnels ou donnees sensibles.\n\n${combined}`;

      const res = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ model, prompt, stream: false, options: { num_predict: 250 } }),
        signal:  AbortSignal.timeout(30000),
      });

      if (res.ok) {
        const data    = await res.json();
        const summary = maskSecretPatterns((data.response || '').trim());
        if (summary) return { summary, method: 'ai', model };
      }
    } catch { /* fallback extractif */ }
  }

  // Fallback extractif
  const sentences = combined
    .split(/[.!?\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20);
  const extractive = sentences.slice(0, 4).join('. ').trim();
  return { summary: extractive || combined.slice(0, 400), method: 'extractive' };
}

module.exports = { summarizeItems };

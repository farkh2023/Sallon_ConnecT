'use strict';

const { isLocalUrl } = require('./aiSafety');

const DEFAULT_URL     = 'http://127.0.0.1:11434';
const DEFAULT_MODEL   = 'qwen2.5:7b';
const DEFAULT_TIMEOUT = 30000;

function getConfig() {
  const url     = process.env.SALLON_OLLAMA_URL   || DEFAULT_URL;
  const model   = process.env.SALLON_OLLAMA_MODEL || DEFAULT_MODEL;
  const timeout = parseInt(process.env.SALLON_AI_TIMEOUT_MS || String(DEFAULT_TIMEOUT), 10);
  return { url, model, timeout };
}

async function checkAvailability() {
  const { url, timeout } = getConfig();
  if (!isLocalUrl(url)) return { available: false, reason: 'url_non_locale' };
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.min(timeout, 5000));
    const res = await fetch(`${url}/api/tags`, { signal: controller.signal });
    clearTimeout(timer);
    return { available: res.ok, status: res.status };
  } catch {
    return { available: false, reason: 'ollama_indisponible' };
  }
}

async function listModels() {
  const { url, timeout } = getConfig();
  if (!isLocalUrl(url)) return [];
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.min(timeout, 5000));
    const res = await fetch(`${url}/api/tags`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.models || []).map(m => ({ name: m.name, size: m.size }));
  } catch {
    return [];
  }
}

async function generate(prompt, options = {}) {
  const { url, model: defaultModel, timeout } = getConfig();
  if (!isLocalUrl(url)) throw new Error('url_ollama_non_locale');
  const model = options.model || defaultModel;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(`${url}/api/generate`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        model,
        prompt,
        stream:  false,
        options: { temperature: 0.3, top_p: 0.9 },
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`ollama_http_${res.status}`);
    const data = await res.json();
    return data.response || '';
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { getConfig, checkAvailability, listModels, generate };

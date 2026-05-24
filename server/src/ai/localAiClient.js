'use strict';

const ollama = require('./ollamaClient');
const { maskSecrets, truncateInput, sanitizeAiResponse } = require('./aiSafety');

function isEnabled() {
  return process.env.SALLON_AI_ENABLED === 'true';
}

function getProvider() {
  return process.env.SALLON_AI_PROVIDER || 'ollama';
}

async function getStatus() {
  const enabled  = isEnabled();
  const provider = getProvider();
  const config   = ollama.getConfig();

  if (!enabled) {
    return { enabled: false, provider, model: config.model, available: false, reason: 'ai_disabled' };
  }
  if (provider !== 'ollama') {
    return { enabled, provider, model: config.model, available: false, reason: 'provider_inconnu' };
  }

  const availability = await ollama.checkAvailability();
  return {
    enabled,
    provider,
    model:     config.model,
    ollamaUrl: config.url,
    available: availability.available,
    reason:    availability.reason || null,
  };
}

async function chat(systemPrompt, userMessage) {
  if (!isEnabled()) return { ok: false, error: 'ai_disabled', response: null };

  const safeInput  = truncateInput(maskSecrets(userMessage));
  const fullPrompt = `${systemPrompt}\n\nUtilisateur: ${safeInput}\n\nAssistant:`;

  try {
    const raw = await ollama.generate(fullPrompt);
    return { ok: true, response: sanitizeAiResponse(raw), error: null };
  } catch (err) {
    return { ok: false, error: err.message || 'erreur_ia', response: null };
  }
}

module.exports = { isEnabled, getProvider, getStatus, chat };

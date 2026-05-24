'use strict';

const { chat }                   = require('./localAiClient');
const { DIAGNOSTICS_PROMPT }     = require('./aiPromptTemplates');
const { maskSecrets, truncateInput } = require('./aiSafety');

async function analyzeDiagnostics(snapshot) {
  const raw       = typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot, null, 2);
  const safe      = maskSecrets(raw);
  const truncated = truncateInput(safe);
  const message   = `Voici un snapshot de diagnostics :\n\n${truncated}\n\nAnalyse l'etat du systeme et propose des actions correctives sures.`;
  return chat(DIAGNOSTICS_PROMPT, message);
}

module.exports = { analyzeDiagnostics };

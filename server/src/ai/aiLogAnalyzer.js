'use strict';

const { chat }                   = require('./localAiClient');
const { LOG_ANALYSIS_PROMPT }    = require('./aiPromptTemplates');
const { maskSecrets, truncateInput } = require('./aiSafety');

async function analyzeLogs(logText) {
  const raw       = typeof logText === 'string' ? logText : String(logText);
  const safe      = maskSecrets(raw);
  const truncated = truncateInput(safe);
  const message   = `Voici des logs systeme :\n\n${truncated}\n\nResume les erreurs importantes et propose des pistes de resolution.`;
  return chat(LOG_ANALYSIS_PROMPT, message);
}

module.exports = { analyzeLogs };

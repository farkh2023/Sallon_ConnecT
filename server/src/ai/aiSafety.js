'use strict';

const MAX_INPUT_CHARS = parseInt(process.env.SALLON_AI_MAX_INPUT_CHARS || '12000', 10);

// Ollama doit etre localhost ou 127.0.0.1 uniquement
const LOCAL_URL_REGEX = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/;

// Commandes destructrices interdites
const DANGEROUS_PATTERNS = [
  /rm\s+-rf/i,
  /\bdel\s+\/s\b/i,
  /\bformat\s+[a-zA-Z]:/i,
  /\breg\s+delete\b/i,
  /Remove-Item\b.*-Recurse.*-Force/i,
  /Remove-Item\b.*-Force.*-Recurse/i,
  /\bStop-Computer\b/i,
  /\bshutdown\s+\/[srf]/i,
  /\bshutdown\b.*\/p\b/i,
  /curl\s+https?:\/\/(?!localhost|127\.0\.0\.1)/i,
  /Invoke-WebRequest\s+['"´]?https?:\/\/(?!localhost|127\.0\.0\.1)/i,
  /Invoke-RestMethod\s+['"´]?https?:\/\/(?!localhost|127\.0\.0\.1)/i,
  /wget\s+https?:\/\/(?!localhost|127\.0\.0\.1)/i,
  /iwr\s+https?:\/\/(?!localhost|127\.0\.0\.1)/i,
];

// Masquage de secrets dans les textes
const SECRET_PATTERNS = [
  { re: /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi,         rep: 'Bearer [masqué]' },
  { re: /\bpassword\s*[=:]\s*\S+/gi,                 rep: 'password=[masqué]' },
  { re: /\btoken\s*[=:]\s*[A-Za-z0-9._~+/=-]{8,}/gi, rep: 'token=[masqué]' },
  { re: /\bapi[_-]?key\s*[=:]\s*\S+/gi,              rep: 'api_key=[masqué]' },
  { re: /\bsecret\s*[=:]\s*\S+/gi,                   rep: 'secret=[masqué]' },
  { re: /[A-Za-z]:\\Users\\[^\\\s"']+/g,             rep: '[chemin-masqué]' },
];

function isLocalUrl(url) {
  if (typeof url !== 'string' || !url) return false;
  return LOCAL_URL_REGEX.test(url);
}

function maskSecrets(text) {
  if (typeof text !== 'string') return '';
  let result = text;
  for (const { re, rep } of SECRET_PATTERNS) {
    result = result.replace(re, rep);
  }
  return result;
}

function truncateInput(text, maxChars) {
  const limit = typeof maxChars === 'number' ? maxChars : MAX_INPUT_CHARS;
  if (typeof text !== 'string') return '';
  if (text.length <= limit) return text;
  return text.slice(0, limit) + '\n[... tronqué pour sécurité ...]';
}

function isCommandSafe(command) {
  if (typeof command !== 'string') return { safe: false, reason: 'commande_invalide' };
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(command)) {
      const tag = pattern.toString().slice(1, 30).replace(/\\\s/g, ' ');
      return { safe: false, reason: `pattern_dangereux_detecte: ${tag}` };
    }
  }
  return { safe: true, reason: null };
}

function sanitizeAiResponse(text) {
  if (typeof text !== 'string') return '';
  return maskSecrets(text).slice(0, 8000);
}

function getAiSafety() {
  return {
    localOnly:                 true,
    noCloudAllowed:            true,
    noAutoExecution:           true,
    ollamaLocalOnly:           true,
    maxInputChars:             MAX_INPUT_CHARS,
    secretMaskingEnabled:      true,
    dangerousCommandBlocking:  true,
    suggestionsAreDryRunOnly:  true,
  };
}

module.exports = {
  isLocalUrl,
  maskSecrets,
  truncateInput,
  isCommandSafe,
  sanitizeAiResponse,
  getAiSafety,
  MAX_INPUT_CHARS,
};

'use strict';

const path = require('path');
const { maskSecrets } = require('../aiSafety');

const MAX_FILE_SIZE_MB  = parseFloat(process.env.SALLON_RAG_MAX_FILE_SIZE_MB || '2');
const MAX_QUESTION_CHARS = 2000;

// Sources indexables autorisees
const ALLOWED_SOURCE_PATTERNS = [
  /^docs[\\/].+\.md$/i,
  /^README\.md$/i,
  /^CHANGELOG\.md$/i,
  /^ROADMAP\.md$/i,
];

// Extensions binaires exclues
const BINARY_EXTENSIONS = new Set([
  '.exe', '.dll', '.zip', '.png', '.jpg', '.jpeg', '.gif', '.pdf',
  '.psd', '.ico', '.mp3', '.mp4', '.mkv', '.bin', '.gz', '.tar',
  '.woff', '.woff2', '.ttf', '.otf', '.eot',
]);

// Chemins interdits (sensibles ou prives)
const FORBIDDEN_PATTERNS = [
  /\.env(\.|$)/i,
  /node_modules/,
  /\.next/,
  /runtime[\\/]/,
  /backups[\\/]/,
  /dist[\\/]/,
  /logs[\\/]/,
  /\.git[\\/]/,
  /\.pem$/i,
  /\.key$/i,
  /\.p12$/i,
  /\.crt$/i,
  /\.pfx$/i,
];

function isSourceAllowed(relativePath) {
  if (typeof relativePath !== 'string' || !relativePath) return false;
  const normalized = relativePath.replace(/\\/g, '/');
  // Rejeter path traversal et chemins absolus
  if (normalized.includes('..') || path.isAbsolute(relativePath)) return false;
  // Rejeter les chemins interdits
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(normalized)) return false;
  }
  // Rejeter les extensions binaires
  const ext = path.extname(normalized).toLowerCase();
  if (BINARY_EXTENSIONS.has(ext)) return false;
  // Verifier l'allowlist
  return ALLOWED_SOURCE_PATTERNS.some(re => re.test(normalized));
}

function isFileSizeAllowed(sizeBytes) {
  const limitBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
  return typeof sizeBytes === 'number' && sizeBytes <= limitBytes;
}

function maskSourceContent(text) {
  if (typeof text !== 'string') return '';
  return maskSecrets(text);
}

function sanitizeQuestion(question) {
  if (typeof question !== 'string') return '';
  return maskSecrets(question).slice(0, MAX_QUESTION_CHARS);
}

function maskCitationPath(filePath) {
  if (typeof filePath !== 'string') return '[source]';
  const normalized = filePath.replace(/\\/g, '/');
  // Supprimer tout prefixe de chemin absolu Windows
  const clean = normalized
    .replace(/^[A-Za-z]:\/.*?(?=(docs\/|README|CHANGELOG|ROADMAP))/, '')
    .replace(/^[A-Za-z]:\\.*?(?=(docs\\|README|CHANGELOG|ROADMAP))/, '');
  return clean || '[source]';
}

function getRagSafety() {
  return {
    localOnly:              true,
    noCloudAllowed:         true,
    sourceAllowlist:        true,
    pathTraversalBlocked:   true,
    secretMaskingEnabled:   true,
    maxFileSizeMB:          MAX_FILE_SIZE_MB,
    maxQuestionChars:       MAX_QUESTION_CHARS,
    citationsLocalOnly:     true,
  };
}

module.exports = {
  isSourceAllowed,
  isFileSizeAllowed,
  maskSourceContent,
  sanitizeQuestion,
  maskCitationPath,
  getRagSafety,
  MAX_FILE_SIZE_MB,
  MAX_QUESTION_CHARS,
};

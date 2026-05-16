'use strict';
/* =============================================
   streamingSafety.js — Phase 11
   Sécurité centrale du module streaming assisté.
   Règles absolues :
   - jamais exposer un chemin absolu complet
   - jamais modifier les fichiers
   - jamais streamer sans confirmation
   - jamais vers un renderer non allowlisté
   - bloquer les traversées de répertoire
============================================= */

const fs   = require('fs');
const path = require('path');

/* Patterns de chemins dangereux — bloqués absolument */
const BLOCKED_PATH_PATTERNS = [
  /\.\.[/\\]/,               // Traversal ../
  /^~[/\\]/,                 // Home dir
  /AppData/i,                // Windows AppData
  /\.ssh/i,                  // SSH keys
  /[/\\]etc[/\\]/,           // Linux /etc
  /Windows[/\\]System32/i,  // Windows system
  /[/\\]proc[/\\]/,          // Linux /proc
  /[/\\]sys[/\\]/,           // Linux /sys
];

const EXTENSION_TYPES = {
  video: ['.mp4', '.mkv', '.avi', '.mov', '.m4v', '.webm'],
  audio: ['.mp3', '.flac', '.aac', '.ogg', '.wav', '.m4a'],
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'],
};

function getMediaType(ext) {
  const e = (ext || '').toLowerCase();
  for (const [type, exts] of Object.entries(EXTENSION_TYPES)) {
    if (exts.includes(e)) return type;
  }
  return 'unknown';
}

function maskRendererId(rendererId) {
  if (!rendererId || typeof rendererId !== 'string') return '[renderer-masqué]';
  if (rendererId.length <= 4) return '***';
  return `${rendererId.substring(0, 4)}***${rendererId.slice(-1)}`;
}

/* Masque le chemin : retourne uniquement le nom de fichier */
function maskMediaPath(filePath) {
  if (!filePath) return '[chemin-masqué]';
  return path.basename(filePath);
}

/* ── Validations ──────────────────────────── */

function validateStreamingConfig(config) {
  if (!config || !config.streaming) {
    return { valid: false, errors: ['Configuration streaming manquante'] };
  }
  const errors = [];
  if (!config.streaming.enabled) errors.push('Streaming désactivé (MEDIA_STREAMING_ENABLED=false)');
  if (!config.streaming.allowedDir || !config.streaming.allowedDir.trim()) {
    errors.push('Dossier non configuré (MEDIA_STREAMING_ALLOWED_DIR vide)');
  }
  return { valid: errors.length === 0, errors };
}

function validateAllowedMediaDirectory(dirPath) {
  if (!dirPath || !dirPath.trim()) {
    return { valid: false, reason: 'Dossier média non configuré (MEDIA_STREAMING_ALLOWED_DIR vide).' };
  }
  for (const pattern of BLOCKED_PATH_PATTERNS) {
    if (pattern.test(dirPath)) {
      return { valid: false, reason: 'Dossier bloqué pour des raisons de sécurité.' };
    }
  }
  try {
    const stats = fs.statSync(dirPath);
    if (!stats.isDirectory()) {
      return { valid: false, reason: 'Le chemin configuré n\'est pas un dossier.' };
    }
  } catch {
    return { valid: false, reason: 'Dossier inaccessible ou inexistant.' };
  }
  return { valid: true };
}

function validateMediaFilePath(filePath, config) {
  if (!filePath) return { valid: false, reason: 'Chemin de fichier absent.' };

  for (const pattern of BLOCKED_PATH_PATTERNS) {
    if (pattern.test(filePath)) {
      return { valid: false, reason: 'Chemin non autorisé (traversal détecté).' };
    }
  }

  const allowedDir = config.streaming && config.streaming.allowedDir;
  if (!allowedDir) return { valid: false, reason: 'Dossier autorisé non configuré.' };

  const resolvedFile    = path.resolve(filePath);
  const resolvedAllowed = path.resolve(allowedDir);

  if (!resolvedFile.startsWith(resolvedAllowed + path.sep) && resolvedFile !== resolvedAllowed) {
    return { valid: false, reason: 'Fichier hors du dossier autorisé.' };
  }
  return { valid: true };
}

function validateMediaExtension(filePath, config) {
  const ext = path.extname(filePath || '').toLowerCase();
  if (!ext) return { valid: false, reason: 'Extension de fichier manquante.' };

  const allowed = ((config.streaming && config.streaming.allowedExtensions) || '.mp4,.mkv,.mp3,.jpg,.jpeg,.png')
    .split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

  if (!allowed.includes(ext)) {
    return { valid: false, reason: `Extension "${ext}" non autorisée.` };
  }
  return { valid: true, ext };
}

function validateMediaSize(filePath, config) {
  const maxMb = (config.streaming && config.streaming.maxFileMb) || 500;
  try {
    const stats  = fs.statSync(filePath);
    const sizeMb = stats.size / (1024 * 1024);
    if (sizeMb > maxMb) {
      return { valid: false, reason: `Fichier trop grand (${sizeMb.toFixed(1)} Mo > ${maxMb} Mo max).` };
    }
    return { valid: true, sizeMb: Math.round(sizeMb * 10) / 10 };
  } catch {
    return { valid: false, reason: 'Impossible de vérifier la taille du fichier.' };
  }
}

function validateRendererAllowed(rendererId, config) {
  const allowlist = ((config.dlna && config.dlna.rendererAllowlist) || '')
    .split(',').map(s => s.trim()).filter(Boolean);
  if (allowlist.length === 0) {
    return { valid: false, reason: 'Renderer non autorisé. Configurez DLNA_RENDERER_ALLOWLIST dans .env.' };
  }
  if (!allowlist.includes(rendererId)) {
    return { valid: false, reason: 'Renderer non autorisé.' };
  }
  return { valid: true };
}

function validateStreamingConfirmation(input, config) {
  if (!config.streaming || !config.streaming.requireConfirmation) return { valid: true };
  if (!input || typeof input !== 'string' || !input.trim()) {
    return { valid: false, reason: 'Confirmation utilisateur requise.' };
  }
  const expected = (config.streaming && config.streaming.confirmationCode) || 'CONFIRMER_STREAM';
  if (input.trim() !== expected) {
    return { valid: false, reason: 'Code de confirmation incorrect.' };
  }
  return { valid: true };
}

/* Retire les champs sensibles d'un item média */
function sanitizeMediaItem(item) {
  if (!item || typeof item !== 'object') return item;
  const { _absolutePath, path: p, fullPath, absolutePath, ...safe } = item;
  return safe;
}

function sanitizeStreamingError(error) {
  if (!error) return { message: 'Erreur streaming inconnue' };
  let message = error.message || String(error);
  const allowedDir = process.env.MEDIA_STREAMING_ALLOWED_DIR || '';
  if (allowedDir && message.includes(allowedDir)) {
    message = message.split(allowedDir).join('[dossier-autorisé]');
  }
  return { message, ...(error.code ? { code: error.code } : {}) };
}

/* Construit une entrée d'audit — jamais de chemins absolus */
function buildStreamingAuditEntry(data) {
  return {
    auditId:          data.auditId,
    mediaId:          data.mediaId,
    mediaTitle:       data.mediaTitle || 'Média',
    mediaType:        data.mediaType  || 'unknown',
    rendererIdMasked: maskRendererId(data.rendererId || ''),
    rendererName:     data.rendererName || 'Renderer',
    requestedAt:      data.requestedAt,
    executedAt:       data.executedAt || null,
    mode:             data.mode || 'assisted',
    status:           data.status,
    reason:           (data.reason || '').substring(0, 200),
    confirmationUsed: data.confirmationUsed || false,
    source:           'Sallon-ConnecT',
    filePathExposed:  false,
    rendererAllowed:  data.rendererAllowed !== false,
  };
}

module.exports = {
  validateStreamingConfig,
  validateAllowedMediaDirectory,
  validateMediaFilePath,
  validateMediaExtension,
  validateMediaSize,
  validateRendererAllowed,
  validateStreamingConfirmation,
  maskMediaPath,
  sanitizeMediaItem,
  sanitizeStreamingError,
  buildStreamingAuditEntry,
  getMediaType,
  maskRendererId,
  EXTENSION_TYPES,
};

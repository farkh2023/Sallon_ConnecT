'use strict';

const fs = require('fs');
const path = require('path');

function normalizeExtensions(value) {
  return String(value || '')
    .split(',')
    .map(extension => extension.trim().toLowerCase())
    .filter(Boolean)
    .map(extension => extension.startsWith('.') ? extension : `.${extension}`);
}

function getAllowedRoots(config) {
  return [config.realMedia.videoRoot, config.realMedia.photoRoot]
    .filter(root => typeof root === 'string' && root.trim())
    .map(root => path.resolve(root));
}

function isPathInsideAllowedRoots(filePath, allowedRoots) {
  if (!filePath || !Array.isArray(allowedRoots)) return false;
  const resolvedFile = path.resolve(filePath);
  return allowedRoots.some(root => {
    const resolvedRoot = path.resolve(root);
    return resolvedFile === resolvedRoot || resolvedFile.startsWith(`${resolvedRoot}${path.sep}`);
  });
}

function getRealAllowedRoots(allowedRoots) {
  if (!Array.isArray(allowedRoots)) return [];
  return allowedRoots.flatMap(root => {
    try {
      return [fs.realpathSync.native(root)];
    } catch {
      return [];
    }
  });
}

function isRealPathInsideAllowedRoots(filePath, allowedRoots) {
  try {
    const realFilePath = fs.realpathSync.native(filePath);
    return isPathInsideAllowedRoots(realFilePath, getRealAllowedRoots(allowedRoots));
  } catch {
    return false;
  }
}

function assertMediaFileIsAllowed(filePath, allowedRoots) {
  let realFilePath;
  try {
    realFilePath = fs.realpathSync.native(filePath);
  } catch (error) {
    if (error && ['ENOENT', 'ENOTDIR'].includes(error.code)) {
      return { valid: false, status: 404, reason: 'Fichier média introuvable.' };
    }
    return { valid: false, status: 500, reason: 'Impossible de vérifier le fichier média.' };
  }

  if (!isPathInsideAllowedRoots(realFilePath, getRealAllowedRoots(allowedRoots))) {
    return { valid: false, status: 403, reason: 'Accès média interdit.' };
  }

  return { valid: true, realFilePath };
}

function validateMediaPath(filePath, config) {
  const allowedRoots = getAllowedRoots(config);

  // Lexical pre-check (fast, no I/O) — catches obvious path traversal
  if (!isPathInsideAllowedRoots(filePath, allowedRoots)) {
    return { valid: false, status: 403, reason: 'Accès média interdit.' };
  }

  const extension = path.extname(filePath).toLowerCase();
  const allowedExtensions = normalizeExtensions(config.realMedia.allowedExtensions);
  if (!allowedExtensions.includes(extension)) {
    return { valid: false, status: 403, reason: 'Extension média interdite.' };
  }

  // Real-path check: resolves symlinks so a link inside the root pointing
  // outside is caught here rather than relying on a separate call site.
  let realFilePath;
  try {
    realFilePath = fs.realpathSync.native(filePath);
  } catch (err) {
    if (err && ['ENOENT', 'ENOTDIR'].includes(err.code)) {
      return { valid: false, status: 404, reason: 'Fichier média introuvable.' };
    }
    return { valid: false, status: 500, reason: 'Impossible de vérifier le fichier média.' };
  }

  if (!isPathInsideAllowedRoots(realFilePath, getRealAllowedRoots(allowedRoots))) {
    return { valid: false, status: 403, reason: 'Accès média interdit.' };
  }

  return { valid: true, extension, realFilePath };
}

module.exports = {
  normalizeExtensions,
  getAllowedRoots,
  getRealAllowedRoots,
  isPathInsideAllowedRoots,
  isRealPathInsideAllowedRoots,
  assertMediaFileIsAllowed,
  validateMediaPath,
};

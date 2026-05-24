'use strict';

const BACKUP_ID_REGEX = /^[A-Za-z0-9_\-.]{1,64}$/;

function validateSnapshotId(id) {
  if (!id || typeof id !== 'string') return null;
  if (id.includes('..') || id.includes('/') || id.includes('\\')) return null;
  if (!BACKUP_ID_REGEX.test(id)) return null;
  return id;
}

function rejectUnsafeSnapshotId(id) {
  if (!validateSnapshotId(id)) {
    return { error: 'invalid_snapshot_id', message: 'ID de snapshot invalide ou non autorise.' };
  }
  return null;
}

function maskRestorePath(text) {
  if (!text || typeof text !== 'string') return text;
  return text
    .replace(/[A-Z]:\\Users\\[^\\]+\\/gi, '<user>\\')
    .replace(/\/home\/[^/]+\//gi, '<home>/')
    .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/g, 'Bearer <masked>')
    .replace(/token[=:]\s*["']?[A-Za-z0-9\-._~+/]{8,}["']?/gi, 'token=<masked>');
}

function sanitizeRestoreAssistantResponse(data) {
  if (!data) return data;
  try {
    const str = JSON.stringify(data);
    const masked = maskRestorePath(str);
    return JSON.parse(masked);
  } catch {
    return data;
  }
}

function buildManualRestoreCommand(snapshotId) {
  const safe = validateSnapshotId(snapshotId);
  if (!safe) return null;
  return `.\\scripts\\windows\\backup\\restore-backup.ps1 -SnapshotId ${safe}`;
}

function ensureRestoreIsManualOnly() {
  return {
    manualOnly:      true,
    noAutoRestore:   true,
    noApiExecution:  true,
    requiresPowerShell: true,
    message: "La restauration ne peut pas etre effectuee automatiquement via le dashboard.",
  };
}

function buildRestoreRisk(snapshot, verifyResult, dryRun) {
  let score = 0;
  const reasons = [];
  const blockingReasons = [];

  if (!snapshot || !snapshot.valid) {
    blockingReasons.push('Snapshot marque comme invalide.');
  }
  if (verifyResult && verifyResult.results) {
    for (const r of verifyResult.results) {
      if (r.missing && r.missing.length > 0) {
        blockingReasons.push(`Fichiers manquants : ${r.missing.length}`);
        score += 50;
      }
      if (r.corrupted && r.corrupted.length > 0) {
        blockingReasons.push(`Fichiers corrompus : ${r.corrupted.length}`);
        score += 50;
      }
    }
  }
  if (dryRun && dryRun.blockedReasons && dryRun.blockedReasons.length > 0) {
    blockingReasons.push(...dryRun.blockedReasons);
  }

  if (blockingReasons.length > 0) {
    return { level: 'blocked', score: 100, reasons, blockingReasons };
  }

  if (snapshot) {
    if (snapshot.type === 'full') {
      score += 20;
      reasons.push('Backup complet : remplace plus de fichiers.');
    } else {
      score += 5;
      reasons.push('Backup rapide : perimetre limite.');
    }

    if (snapshot.timestamp) {
      const ageMs = Date.now() - new Date(snapshot.timestamp).getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      if (ageDays > 30) {
        score += 20;
        reasons.push(`Snapshot age de ${Math.floor(ageDays)} jours.`);
      } else if (ageDays > 7) {
        score += 10;
        reasons.push(`Snapshot age de ${Math.floor(ageDays)} jours.`);
      }
    }
  }

  if (dryRun && dryRun.wouldReplace && dryRun.wouldReplace.length > 10) {
    score += 15;
    reasons.push(`${dryRun.wouldReplace.length} fichiers seraient remplaces.`);
  }

  let level;
  if (score >= 50) level = 'high';
  else if (score >= 20) level = 'medium';
  else level = 'low';

  return { level, score, reasons, blockingReasons: [] };
}

module.exports = {
  validateSnapshotId,
  rejectUnsafeSnapshotId,
  maskRestorePath,
  sanitizeRestoreAssistantResponse,
  buildManualRestoreCommand,
  ensureRestoreIsManualOnly,
  buildRestoreRisk,
};

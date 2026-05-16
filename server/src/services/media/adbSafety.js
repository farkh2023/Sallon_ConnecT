'use strict';
/* =============================================
   adbSafety.js — Module de sécurité centrale ADB (Phase 6)
   Allowlist stricte, masquage des IDs, validation des commandes.
   Aucune commande destructive ne peut passer ce module.
============================================= */

/* ── Allowlist stricte des commandes autorisées ─── */
const ALLOWED_COMMANDS = [
  'devices',
  'shell getprop ro.product.model',
  'shell getprop ro.product.manufacturer',
  'shell getprop ro.build.version.release',
  'shell dumpsys battery',
  'shell df /sdcard',
];

/* ── Patterns de commandes interdites ──────────── */
const BLOCKED_PATTERNS = [
  /\bpull\b/i,
  /\bpush\b/i,
  /\binstall\b/i,
  /\buninstall\b/i,
  /\bshell\s+rm\b/i,
  /\bshell\s+mv\b/i,
  /\bshell\s+cp\b/i,
  /\bshell\s+input\b/i,
  /\bshell\s+am\b/i,
  /\bshell\s+pm\b/i,
  /\breboot\b/i,
  /\broot\b/i,
  /\bremount\b/i,
  /\/data\/data\b/i,
  /\/data\/user\b/i,
  /\/proc\b/i,
  /\/system\b/i,
  /ANDROID_DATA/i,
];

/* ── Patterns de données sensibles à masquer ──── */
const SENSITIVE_PATTERNS = [
  /* Numéros de série : 10-20 caractères alphanumériques */
  { re: /\b([A-Z0-9]{10,20})\b/g,      mask: (m) => m.slice(0, 3) + '***' + m.slice(-2) },
  /* Adresses MAC */
  { re: /([0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2}/g, mask: () => '**:**:**:**:**:**' },
  /* IMEI — 15 chiffres */
  { re: /\b(\d{15})\b/g,               mask: () => '***-MASKED-***' },
];

/* ── Validation d'une commande ADB ─────────────── */
function validateAdbCommand(args) {
  /* args = partie après "adb [-s <id>]" */
  const trimmed = args.trim();

  /* Vérification contre les patterns bloqués en premier */
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        valid:  false,
        reason: `Commande refusée : correspond au pattern interdit "${pattern.source}"`,
      };
    }
  }

  /* Vérification contre l'allowlist */
  const isAllowed = ALLOWED_COMMANDS.some(allowed => {
    /* Comparaison exacte ou préfixe d'une commande autorisée */
    return trimmed === allowed || trimmed.startsWith(allowed + ' ');
  });

  if (!isAllowed) {
    return {
      valid:  false,
      reason: `Commande non autorisée : "${trimmed}". Seules les commandes de lecture seule sont permises.`,
    };
  }

  return { valid: true };
}

/* ── Masquage de l'ID appareil ─────────────────── */
function maskDeviceId(value) {
  if (!value || typeof value !== 'string') return '***';
  if (value.length <= 6) return '***';
  return value.slice(0, 2) + '*'.repeat(Math.max(3, value.length - 4)) + value.slice(-2);
}

/* ── Nettoyage et masquage de la sortie ADB ─────── */
function sanitizeAdbOutput(output) {
  if (!output || typeof output !== 'string') return output;
  let result = output;
  for (const { re, mask } of SENSITIVE_PATTERNS) {
    result = result.replace(re, mask);
  }
  return result;
}

/* ── Construction d'une erreur sûre (sans fuite) ── */
function buildSafeError(err) {
  if (!err) return { message: 'Erreur inconnue', safe: true };

  const raw = err.message || String(err);

  /* Supprimer les chemins de fichiers potentiellement sensibles */
  const cleaned = raw
    .replace(/C:\\[^\s"']*/g, '[chemin masqué]')
    .replace(/\/[^\s"']+/g, '[chemin masqué]')
    .replace(/\b([A-Z0-9]{10,20})\b/g, '***');

  return {
    message: cleaned,
    safe:    true,
  };
}

module.exports = {
  ALLOWED_COMMANDS,
  BLOCKED_PATTERNS: BLOCKED_PATTERNS.map(r => r.source),
  validateAdbCommand,
  maskDeviceId,
  sanitizeAdbOutput,
  buildSafeError,
};

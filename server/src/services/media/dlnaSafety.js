'use strict';
/* =============================================
   dlnaSafety.js — Module de sécurité centrale DLNA Phase 7
   Validation locale, masquage IP, nettoyage réponses SSDP/XML.
   Aucune action de contrôle ne peut passer ce module.
============================================= */

/* ── Plages réseau local RFC-1918 + link-local ── */
const LOCAL_RANGES = [
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/,
  /^192\.168\.\d{1,3}\.\d{1,3}$/,
  /^169\.254\.\d{1,3}\.\d{1,3}$/,
  /^127\./,
  /^::1$/,
];

/* ── Actions SOAP/contrôle interdites ─────────── */
const BLOCKED_ACTIONS = [
  'Play', 'Pause', 'Stop', 'Seek', 'Next', 'Previous',
  'SetVolume', 'SetMute', 'SetAVTransportURI',
  'SetNextAVTransportURI', 'Rewind', 'FastForward',
  'Power', 'PowerOn', 'PowerOff',
];

/* ── Champs XML autorisés (description device) ── */
const ALLOWED_DESC_FIELDS = new Set([
  'friendlyName', 'manufacturer', 'modelName',
  'deviceType', 'UDN', 'serviceList',
]);

/* ── validateDlnaConfig() ──────────────────────── */
function validateDlnaConfig(cfg) {
  const errors = [];
  if (!cfg.enabled) return { valid: true, note: 'DLNA désactivé.' };
  if (cfg.discoveryTimeout < 500 || cfg.discoveryTimeout > 15000) {
    errors.push('DLNA_DISCOVERY_TIMEOUT_MS doit être entre 500 et 15000 ms.');
  }
  if (cfg.maxResponses < 1 || cfg.maxResponses > 100) {
    errors.push('DLNA_MAX_RESPONSES doit être entre 1 et 100.');
  }
  return { valid: errors.length === 0, errors };
}

/* ── isLocalAddress() ──────────────────────────── */
function isLocalAddress(address) {
  if (!address || typeof address !== 'string') return false;
  return LOCAL_RANGES.some(re => re.test(address.trim()));
}

/* ── maskLocalIp() ─────────────────────────────── */
function maskLocalIp(value) {
  if (!value || typeof value !== 'string') return '***.***.***.*';
  /* Masque les 2 derniers octets : 192.168.1.42 → 192.168.*.* */
  return value.replace(/(\d+\.\d+)\.\d+\.\d+/, '$1.*.*');
}

/* ── sanitizeSsdpResponse() ────────────────────── */
function sanitizeSsdpResponse(raw, maskIp) {
  if (!raw || typeof raw !== 'string') return {};

  const lines = raw.split(/\r?\n/);
  const result = {};

  for (const line of lines) {
    const sep = line.indexOf(':');
    if (sep === -1) continue;
    const key = line.slice(0, sep).trim().toUpperCase();
    const val = line.slice(sep + 1).trim();

    switch (key) {
      case 'LOCATION':
        /* N'accepter que les URLs locales */
        if (/^https?:\/\//i.test(val)) {
          try {
            const u = new URL(val);
            if (isLocalAddress(u.hostname)) {
              result.location = maskIp ? val.replace(u.hostname, maskLocalIp(u.hostname)) : val;
            }
          } catch { /* URL invalide — ignorer */ }
        }
        break;
      case 'ST':     result.st     = val; break;
      case 'USN':    result.usn    = val.slice(0, 100); break;
      case 'SERVER': result.server = val.slice(0, 120); break;
      case 'CACHE-CONTROL': result.cacheControl = val; break;
    }
  }

  return result;
}

/* ── sanitizeDeviceDescription() ──────────────── */
function sanitizeDeviceDescription(xmlText) {
  if (!xmlText || typeof xmlText !== 'string') return {};
  const result = {};

  for (const field of ALLOWED_DESC_FIELDS) {
    const re  = new RegExp(`<${field}>([^<]*)</${field}>`, 'i');
    const m   = xmlText.match(re);
    if (m) result[field] = m[1].trim().slice(0, 200);
  }

  /* Extraire les types de services (lecture seule) */
  const serviceTypes = [...xmlText.matchAll(/<serviceType>([^<]*)<\/serviceType>/gi)]
    .map(m => m[1].trim())
    .filter(s => s.length < 100);
  if (serviceTypes.length) result.serviceTypes = serviceTypes;

  return result;
}

/* ── buildSafeDlnaError() ──────────────────────── */
function buildSafeDlnaError(err) {
  if (!err) return { message: 'Erreur DLNA inconnue', safe: true };
  const raw = err.message || String(err);
  const cleaned = raw
    .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '***.***.*.*')
    .replace(/:[0-9]{2,5}\b/g, ':****');
  return { message: cleaned.slice(0, 200), safe: true };
}

module.exports = {
  BLOCKED_ACTIONS,
  ALLOWED_DESC_FIELDS: [...ALLOWED_DESC_FIELDS],
  validateDlnaConfig,
  isLocalAddress,
  maskLocalIp,
  sanitizeSsdpResponse,
  sanitizeDeviceDescription,
  buildSafeDlnaError,
};

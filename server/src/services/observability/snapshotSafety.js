'use strict';

const RE_BEARER = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi;
const RE_SECRET = /\b(?:token|secret|password|api[_-]?key)\s*[:=]\s*\S+/gi;
const RE_IP = /\b(?:(?:192\.168|10\.|172\.(?:1[6-9]|2\d|3[01]))\.\d{1,3}\.\d{1,3})\b/g;
const RE_WIN_PATH = /[A-Za-z]:\\[^\s"',;]+/g;
const RE_UNIX_PATH = /\/(?:Users|home|root|etc|var|tmp|mnt)\/[^\s"',;]*/g;
const RE_LONG_KEY = /\b[A-Za-z0-9._-]{32,}\b/g;

const BUCKET_LEVEL = ['none', 'low', 'medium', 'high'];
const BUCKET_UPTIME = ['short', 'medium', 'long'];
const BUCKET_MEM = ['low', 'medium', 'high'];
const VALID_STATUSES = ['ok', 'warning', 'error'];
const VALID_INTEGRATION = ['disabled', 'available', 'warning', 'error'];
const VALID_SOURCES = ['manual', 'scheduler', 'startup'];

function maskString(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(RE_BEARER, 'Bearer [masked]')
    .replace(RE_SECRET, '[secret-masked]')
    .replace(RE_IP, '[ip-masked]')
    .replace(RE_WIN_PATH, '[path-masked]')
    .replace(RE_UNIX_PATH, '[path-masked]')
    .replace(RE_LONG_KEY, '[id-masked]');
}

function pickBucket(value, allowed) {
  return allowed.includes(value) ? value : allowed[0];
}

function sanitizeSnapshot(input) {
  if (!input || typeof input !== 'object') return {};
  const b = input.backend || {};
  const f = input.frontend || {};
  const i = input.integrations || {};
  const s = input.scheduler || {};
  const n = input.notifications || {};
  const sec = input.security || {};
  const rt = input.runtime || {};

  return {
    id: typeof input.id === 'string' ? maskString(input.id).slice(0, 32) : undefined,
    createdAt: typeof input.createdAt === 'string' ? input.createdAt : new Date().toISOString(),
    source: VALID_SOURCES.includes(input.source) ? input.source : 'manual',
    status: VALID_STATUSES.includes(input.status) ? input.status : 'ok',
    phase: 18,
    backend: {
      ok: Boolean(b.ok),
      uptimeBucket: pickBucket(b.uptimeBucket, BUCKET_UPTIME),
      memoryBucket: pickBucket(b.memoryBucket, BUCKET_MEM),
    },
    frontend: {
      expectedPort: typeof f.expectedPort === 'number' ? f.expectedPort : 3001,
      configured: Boolean(f.configured),
    },
    integrations: {
      adb:         pickBucket(i.adb, VALID_INTEGRATION),
      dlna:        pickBucket(i.dlna, VALID_INTEGRATION),
      smartThings: pickBucket(i.smartThings, VALID_INTEGRATION),
      streaming:   pickBucket(i.streaming, VALID_INTEGRATION),
    },
    scheduler: {
      running:         Boolean(s.running),
      activeSchedules: typeof s.activeSchedules === 'number' ? Math.max(0, s.activeSchedules) : 0,
    },
    notifications: {
      totalBucket:          pickBucket(n.totalBucket, BUCKET_LEVEL),
      unreadBucket:         pickBucket(n.unreadBucket, BUCKET_LEVEL),
      securityEventsBucket: pickBucket(n.securityEventsBucket, BUCKET_LEVEL),
    },
    security: {
      secretsProtected:        sec.secretsProtected !== false,
      runtimeHidden:           sec.runtimeHidden !== false,
      apiCacheDisabled:        sec.apiCacheDisabled !== false,
      sensitiveActionsBlocked: sec.sensitiveActionsBlocked !== false,
    },
    runtime: {
      runtimeFilesBucket: pickBucket(rt.runtimeFilesBucket, BUCKET_LEVEL),
      logsBucket:         pickBucket(rt.logsBucket, BUCKET_LEVEL),
      portableZipPresent: Boolean(rt.portableZipPresent),
    },
  };
}

function maskSnapshotSensitiveData(input) {
  return sanitizeSnapshot(input);
}

function validateSnapshotPayload(input) {
  if (!input || typeof input !== 'object') {
    return { valid: false, reason: 'payload must be an object' };
  }
  if (!VALID_STATUSES.includes(input.status)) {
    return { valid: false, reason: 'invalid status value' };
  }
  if (!VALID_SOURCES.includes(input.source)) {
    return { valid: false, reason: 'invalid source value' };
  }
  return { valid: true };
}

function buildSafeSnapshotError() {
  return {
    status: 'error',
    error: 'Snapshot failed safely.',
    secretsMasked: true,
    localOnly: true,
  };
}

module.exports = {
  sanitizeSnapshot,
  maskSnapshotSensitiveData,
  validateSnapshotPayload,
  buildSafeSnapshotError,
};

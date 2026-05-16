const SENSITIVE_KEYS = /token|password|secret|key|imei|serial|phone|mac/i;
const TOKEN_LIKE = /\b(?:bearer\s+)?[a-z0-9._-]{24,}\b/gi;
const UUID_LIKE = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;
const IPV4_LIKE = /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g;
const WINDOWS_PATH = /\b[a-z]:\\(?:[^\\/:*?"<>|\r\n]+\\)*[^\\/:*?"<>|\r\n]*/gi;
const POSIX_PATH = /(?:^|\s)\/(?:Users|home|var|etc|tmp|mnt|media|Volumes)\/[^\s"'<>]+/g;
const LONG_ID = /\b[a-z0-9][a-z0-9_-]{15,}\b/gi;

function hasPattern(pattern: RegExp, text: string): boolean {
  pattern.lastIndex = 0;
  const found = pattern.test(text);
  pattern.lastIndex = 0;
  return found;
}

export function isSensitiveField(key: string): boolean {
  return SENSITIVE_KEYS.test(key);
}

export function maskSensitiveValue(val: string): string {
  if (val.length <= 4) return '****';
  return `${val.slice(0, 2)}****${val.slice(-2)}`;
}

export function sanitizeRecord(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, isSensitiveField(k) ? '[masque]' : v])
  );
}

export function maskSensitiveClientText(value: unknown): string {
  if (value == null) return '';

  return String(value)
    .replace(IPV4_LIKE, '[ip-masquee]')
    .replace(WINDOWS_PATH, '[chemin-masque]')
    .replace(POSIX_PATH, ' [chemin-masque]')
    .replace(UUID_LIKE, '[id-masque]')
    .replace(TOKEN_LIKE, (match) => {
      if (match.length < 24 || /\s/.test(match.trim())) return match;
      return '[token-masque]';
    })
    .replace(LONG_ID, (match) => {
      if (/^(notification|scheduler|smartthings|streaming|connect|backend)$/i.test(match)) return match;
      return `${match.slice(0, 4)}...${match.slice(-2)}`;
    });
}

export function isSafeDisplayText(value: unknown): boolean {
  const text = String(value ?? '');
  return (
    !hasPattern(IPV4_LIKE, text) &&
    !hasPattern(WINDOWS_PATH, text) &&
    !hasPattern(POSIX_PATH, text) &&
    !hasPattern(UUID_LIKE, text) &&
    !hasPattern(TOKEN_LIKE, text)
  );
}

export function preventSensitiveCache(pathOrUrl: string): boolean {
  const value = pathOrUrl.toLowerCase();
  return (
    value.includes('/api/') ||
    value.includes('/notifications') ||
    value.includes('/smartthings') ||
    value.includes('/adb') ||
    value.includes('/dlna') ||
    value.includes('/streaming') ||
    value.includes('/scheduler') ||
    value.includes('/runtime') ||
    value.includes('token') ||
    value.includes('secret')
  );
}

export function safeNotificationMessage(title: unknown, message?: unknown): string {
  const parts = [title, message].filter((part) => part != null && String(part).trim().length > 0);
  return maskSensitiveClientText(parts.join(' - ')).slice(0, 240);
}

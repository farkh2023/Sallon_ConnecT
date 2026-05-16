const SENSITIVE_KEYS = /token|password|secret|key|imei|serial|phone|mac/i;

export function isSensitiveField(key: string): boolean {
  return SENSITIVE_KEYS.test(key);
}

export function maskSensitiveValue(val: string): string {
  if (val.length <= 4) return '••••';
  return val.slice(0, 2) + '••••' + val.slice(-2);
}

export function sanitizeRecord(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, isSensitiveField(k) ? '[masqué]' : v])
  );
}

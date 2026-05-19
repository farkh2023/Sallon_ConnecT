const BLOCKED_PATTERNS = [
  /smartthings.*scene.*exec/i,
  /tv.*command.*exec/i,
  /streaming.*play/i,
  /backup.*restore/i,
  /audit.*delete/i,
  /notification.*clear/i,
  /profile.*sensitive.*change/i,
];

const SENSITIVE_TERMS = /token|password|secret|bearer|imei|serial|\.env\s*=|private_key/i;

export function maskHelpText(text: string): string {
  return text
    .replace(/Bearer\s+\S+/gi, 'Bearer [masque]')
    .replace(/\b[A-Za-z0-9_-]{32,}\b/g, '[id-masque]');
}

export function isSafeHelpCommand(command: string): boolean {
  const lower = command.toLowerCase();
  return (
    !BLOCKED_PATTERNS.some((p) => p.test(lower)) &&
    !SENSITIVE_TERMS.test(lower)
  );
}

export function sanitizeHelpSearch(text: string): string {
  return text.replace(/[<>"'`]/g, '').slice(0, 120).trim();
}

export function getBlockedHelpActions(): string[] {
  return [
    'SmartThings scene execute',
    'TV command execute',
    'Streaming play automatique',
    'Backup restore sans dry-run',
    'Audit delete',
    'Notification clear (masse)',
    'Profile sensitive change',
  ];
}

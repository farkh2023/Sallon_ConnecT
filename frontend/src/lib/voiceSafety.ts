import type { VoiceCommandIntent, VoiceCommandResult } from '@/lib/types';

const ALLOWED_INTENTS = new Set<VoiceCommandIntent>([
  'navigate',
  'refresh',
  'openPanel',
  'readStatus',
  'toggleTvMode',
  'toggleFullscreen',
  'showNotifications',
  'showScheduler',
  'showObservability',
  'help',
]);

const BLOCKED_INTENTS = new Set<VoiceCommandIntent>([
  'smartthingsScene',
  'tvCommand',
  'streamingPlay',
  'backupRestore',
  'auditClear',
  'profileChange',
]);

const SENSITIVE_COMMANDS: Array<{ intent: VoiceCommandIntent; patterns: RegExp[]; label: string }> = [
  { intent: 'tvCommand', label: 'commande TV', patterns: [/allume.*t[eé]l[eé]/i, /eteins.*t[eé]l[eé]/i, /[eé]teins.*t[eé]l[eé]/i] },
  { intent: 'streamingPlay', label: 'streaming', patterns: [/lance.*film/i, /joue.*vid[eé]o/i, /lance.*streaming/i] },
  { intent: 'smartthingsScene', label: 'scene SmartThings', patterns: [/ex[eé]cute.*sc[eè]ne/i, /lance.*sc[eè]ne/i] },
  { intent: 'backupRestore', label: 'restauration backup', patterns: [/restaure.*sauvegarde/i, /restore.*backup/i] },
  { intent: 'auditClear', label: 'suppression audit', patterns: [/supprime.*audit/i, /vide.*notifications/i] },
  { intent: 'profileChange', label: 'changement profil', patterns: [/change.*profil/i, /bascule.*profil/i] },
];

const BEARER_TOKEN = /\bBearer\s+[a-z0-9._~+/=-]{12,}\b/gi;
const TOKEN_ASSIGNMENT = /\b(token|secret|password|key)\s*[:=]\s*[^\s,;]{6,}/gi;
const IPV4 = /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g;
const WINDOWS_PATH = /\b[a-z]:\\(?:[^\\/:*?"<>|\r\n]+\\)*[^\\/:*?"<>|\r\n]*/gi;
const POSIX_PATH = /(?:^|\s)\/(?:Users|home|var|etc|tmp|mnt|media|Volumes)\/[^\s"'<>]+/g;
const IMEI = /\b\d{15}\b/g;
const LONG_ID = /\b[a-z0-9][a-z0-9_-]{18,}\b/gi;

export function maskVoiceSensitiveText(text: string): string {
  return text
    .replace(BEARER_TOKEN, 'Bearer [token-masque]')
    .replace(TOKEN_ASSIGNMENT, '$1=[masque]')
    .replace(IPV4, '[ip-masquee]')
    .replace(WINDOWS_PATH, '[chemin-masque]')
    .replace(POSIX_PATH, ' [chemin-masque]')
    .replace(IMEI, '[imei-masque]')
    .replace(LONG_ID, (match) => {
      if (/^(observability|notifications|scheduler|smartthings|streaming)$/i.test(match)) return match;
      return `${match.slice(0, 4)}...${match.slice(-2)}`;
    })
    .trim();
}

export function sanitizeTranscript(text: string): string {
  return maskVoiceSensitiveText(String(text || '').replace(/\s+/g, ' ').slice(0, 240));
}

export function classifySensitiveVoiceCommand(text: string): { sensitive: boolean; intent?: VoiceCommandIntent; label?: string } {
  const clean = String(text || '');
  for (const rule of SENSITIVE_COMMANDS) {
    if (rule.patterns.some((pattern) => pattern.test(clean))) {
      return { sensitive: true, intent: rule.intent, label: rule.label };
    }
  }
  return { sensitive: false };
}

export function isVoiceIntentAllowed(intent: VoiceCommandIntent): boolean {
  return ALLOWED_INTENTS.has(intent) && !BLOCKED_INTENTS.has(intent);
}

export function buildSafeVoiceResponse(result: VoiceCommandResult): VoiceCommandResult {
  return {
    ...result,
    message: maskVoiceSensitiveText(result.message),
    transcript: sanitizeTranscript(result.transcript),
    blocked: result.blocked || !isVoiceIntentAllowed(result.intent),
    ok: result.ok && isVoiceIntentAllowed(result.intent),
  };
}

export function getBlockedVoiceActions(): string[] {
  return [
    'Scenes SmartThings',
    'Commandes TV',
    'Lecture streaming',
    'Restauration backup',
    'Suppression audit',
    'Vidage notifications',
    'Changement de profil',
  ];
}

export function getAllowedVoiceActions(): string[] {
  return [
    'Navigation dashboard',
    'Actualisation UI',
    'Ouverture notifications',
    'Ouverture taches',
    'Ouverture observabilite',
    'Mode TV',
    'Plein ecran',
    'Aide vocale',
    'Statut systeme',
  ];
}

import { describe, expect, it } from 'vitest';
import {
  classifySensitiveVoiceCommand,
  getAllowedVoiceActions,
  getBlockedVoiceActions,
  isVoiceIntentAllowed,
  sanitizeTranscript,
} from '@/lib/voiceSafety';

describe('voiceSafety', () => {
  it('masks token, IP, path and long ids in transcripts', () => {
    const token = ['abcdefghijkl', 'mnopqrstuvwxyz', '123456'].join('');
    const ip = ['192', '168', '1', '42'].join('.');
    const separator = String.fromCharCode(92);
    const path = ['C:', 'Example', 'secret.txt'].join(separator);
    const longId = ['abcdef123456', '7890abcdef', '123456'].join('');
    const text = sanitizeTranscript(`Bearer ${token} ${ip} ${path} ${longId}`);

    expect(text).toContain('Bearer [token-masque]');
    expect(text).toContain('[ip-masquee]');
    expect(text).toContain('[chemin-masque]');
    expect(text).not.toContain(token);
    expect(text).not.toContain(longId);
  });

  it('classifies sensitive voice commands', () => {
    expect(classifySensitiveVoiceCommand('allume la tele')).toMatchObject({ sensitive: true, intent: 'tvCommand' });
    expect(classifySensitiveVoiceCommand('restaure la sauvegarde')).toMatchObject({ sensitive: true, intent: 'backupRestore' });
  });

  it('allows only safe intents', () => {
    expect(isVoiceIntentAllowed('navigate')).toBe(true);
    expect(isVoiceIntentAllowed('toggleTvMode')).toBe(true);
    expect(isVoiceIntentAllowed('tvCommand')).toBe(false);
    expect(isVoiceIntentAllowed('backupRestore')).toBe(false);
  });

  it('documents allowed and blocked actions', () => {
    expect(getAllowedVoiceActions()).toContain('Navigation dashboard');
    expect(getBlockedVoiceActions()).toContain('Commandes TV');
  });
});

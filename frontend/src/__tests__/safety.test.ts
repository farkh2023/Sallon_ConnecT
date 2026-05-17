import { describe, expect, it } from 'vitest';
import {
  isSafeDisplayText,
  maskSensitiveClientText,
  preventSensitiveCache,
  safeNotificationMessage,
} from '@/lib/safety';

describe('frontend safety helpers', () => {
  it('masks token, IP and absolute paths', () => {
    const masked = maskSensitiveClientText(
      'Bearer abcdefghijklmnopqrstuvwxyz123456 at 192.168.1.40 in C:\\Users\\Youss\\secret.txt'
    );

    expect(masked).toContain('[ip-masquee]');
    expect(masked).toContain('[chemin-masque]');
    expect(masked).toContain('Bearer [token-masque]');
    expect(isSafeDisplayText(masked)).toBe(true);
  });

  it('prevents sensitive cache targets and sanitizes notification messages', () => {
    expect(preventSensitiveCache('/api/smartthings/status')).toBe(true);
    expect(preventSensitiveCache('/runtime/notifications.json')).toBe(true);
    expect(preventSensitiveCache('/icons/icon-192.png')).toBe(false);

    const message = safeNotificationMessage('Alerte', 'token=abcdefghijklmnopqrstuvwxyz123456');
    expect(message).not.toContain('abcdefghijklmnopqrstuvwxyz123456');
  });
});

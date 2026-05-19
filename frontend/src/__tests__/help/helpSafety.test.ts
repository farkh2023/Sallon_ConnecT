import { describe, expect, it } from 'vitest';
import {
  maskHelpText,
  isSafeHelpCommand,
  sanitizeHelpSearch,
  getBlockedHelpActions,
} from '@/lib/helpSafety';

describe('maskHelpText', () => {
  it('masque les tokens Bearer', () => {
    const result = maskHelpText('Authorization: Bearer abc123def456xyz789qrs');
    expect(result).not.toContain('abc123def456xyz789qrs');
  });

  it('ne touche pas le texte sûr', () => {
    const text = 'npm run health';
    expect(maskHelpText(text)).toBe(text);
  });
});

describe('isSafeHelpCommand', () => {
  it('accepte les commandes npm sûres', () => {
    expect(isSafeHelpCommand('npm run health')).toBe(true);
    expect(isSafeHelpCommand('npm run check')).toBe(true);
    expect(isSafeHelpCommand('scripts\\windows\\start-sallon-connect.bat')).toBe(true);
  });

  it('accepte les commandes PowerShell sûres', () => {
    expect(isSafeHelpCommand('powershell -ExecutionPolicy Bypass -File scripts\\windows\\status-sallon-connect.ps1')).toBe(true);
  });

  it('rejette les actions SmartThings sensibles', () => {
    expect(isSafeHelpCommand('smartthings scene execute scene123')).toBe(false);
  });

  it('rejette les tokens et secrets', () => {
    expect(isSafeHelpCommand('SMARTTHINGS_TOKEN=abc123secret')).toBe(false);
    expect(isSafeHelpCommand('Bearer mytoken')).toBe(false);
  });

  it('rejette les commandes TV sensibles', () => {
    expect(isSafeHelpCommand('tv command execute power-on')).toBe(false);
  });

  it('rejette backup restore', () => {
    expect(isSafeHelpCommand('backup restore forcé')).toBe(false);
  });
});

describe('sanitizeHelpSearch', () => {
  it('supprime les caractères dangereux', () => {
    expect(sanitizeHelpSearch('<script>alert(1)</script>')).not.toContain('<');
    expect(sanitizeHelpSearch('<script>alert(1)</script>')).not.toContain('>');
  });

  it('tronque à 120 caractères', () => {
    const long = 'a'.repeat(200);
    expect(sanitizeHelpSearch(long).length).toBe(120);
  });

  it('conserve le texte de recherche normal', () => {
    expect(sanitizeHelpSearch('npm run health')).toBe('npm run health');
    expect(sanitizeHelpSearch('mode TV')).toBe('mode TV');
  });
});

describe('getBlockedHelpActions', () => {
  it('retourne une liste non vide', () => {
    const actions = getBlockedHelpActions();
    expect(actions.length).toBeGreaterThan(0);
  });

  it('inclut les actions sensibles attendues', () => {
    const actions = getBlockedHelpActions();
    const text = actions.join(' ');
    expect(text).toMatch(/SmartThings/i);
    expect(text).toMatch(/Backup/i);
    expect(text).toMatch(/restore/i);
  });
});

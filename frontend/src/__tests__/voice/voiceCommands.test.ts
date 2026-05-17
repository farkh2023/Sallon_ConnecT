import { describe, expect, it, vi } from 'vitest';
import { executeSafeVoiceCommand, parseVoiceCommand } from '@/lib/voiceCommands';

function context() {
  return {
    navigateToSection: vi.fn(),
    refresh: vi.fn(),
    setTvMode: vi.fn(),
    toggleFullscreen: vi.fn(),
    readStatus: vi.fn(() => 'Systeme local disponible.'),
  };
}

describe('voiceCommands', () => {
  it('parses navigation to devices', () => {
    const command = parseVoiceCommand('ouvre les appareils');
    expect(command.intent).toBe('navigate');
    expect(command.targetSection).toBe('appareils');
  });

  it('executes refresh safely', async () => {
    const ctx = context();
    const result = await executeSafeVoiceCommand(parseVoiceCommand('actualise'), ctx);
    expect(result.ok).toBe(true);
    expect(ctx.refresh).toHaveBeenCalledTimes(1);
  });

  it('activates TV mode safely', async () => {
    const ctx = context();
    const result = await executeSafeVoiceCommand(parseVoiceCommand('active le mode TV'), ctx);
    expect(result.ok).toBe(true);
    expect(ctx.setTvMode).toHaveBeenCalledWith(true);
  });

  it('blocks TV commands', async () => {
    const ctx = context();
    const result = await executeSafeVoiceCommand(parseVoiceCommand('allume la tele'), ctx);
    expect(result.ok).toBe(false);
    expect(result.blocked).toBe(true);
    expect(ctx.setTvMode).not.toHaveBeenCalled();
  });

  it('blocks backup restore commands', async () => {
    const ctx = context();
    const result = await executeSafeVoiceCommand(parseVoiceCommand('restaure la sauvegarde'), ctx);
    expect(result.ok).toBe(false);
    expect(result.blocked).toBe(true);
  });
});

const safety = require('../../server/src/services/media/smartThingsSafety');

const config = {
  tvCommandsEnabled: false,
  tvAuditEnabled: true,
  tvCommandsRequireConfirmation: true,
  tvConfirmationCode: 'CONFIRMER_TV',
  tvDeviceAllowlist: 'tv-safe',
  tvCommandAllowlist: 'switch.on,mediaPlayback.pause',
  tvBlockVolumeCommands: true,
  tvBlockKeypadInput: true,
  tvBlockSourceChange: true,
};

describe('TV commands safety', () => {
  it('keeps TV commands disabled by default', () => {
    expect(safety.validateTvCommandsEnabled(config).valid).toBe(false);
  });

  it('requires allowlisted TV, allowlisted command and confirmation', () => {
    const enabled = { ...config, tvCommandsEnabled: true };
    expect(safety.validateTvDeviceAllowed('unknown-tv', enabled).valid).toBe(false);
    expect(safety.validateTvDeviceAllowed('tv-safe', enabled).valid).toBe(true);
    expect(safety.validateTvCommandAllowed('switch.on', enabled).valid).toBe(true);
    expect(safety.validateTvCommandAllowed('switch.off', enabled).valid).toBe(false);
    expect(safety.validateTvConfirmationCode('', enabled).valid).toBe(false);
    expect(safety.validateTvConfirmationCode('CONFIRMER_TV', enabled).valid).toBe(true);
  });

  it('blocks volume, keypad and source/input commands', () => {
    const enabled = { ...config, tvCommandsEnabled: true };
    expect(safety.validateTvCommandAllowed('audioVolume.setVolume', enabled).valid).toBe(false);
    expect(safety.validateTvCommandAllowed('keypadInput.sendKey', enabled).valid).toBe(false);
    expect(safety.validateTvCommandAllowed('mediaInputSource.setInputSource', enabled).valid).toBe(false);
    expect(() => safety.blockSensitiveTvCommand('audioVolume.volumeUp')).toThrow(/sensible/);
  });

  it('sanitizes preview/result and creates audit only with masked IDs', () => {
    const result = safety.sanitizeTvCommandResult({ deviceId: 'tv-safe-123456', token: 'secret' });
    expect(result).not.toHaveProperty('token');
    expect(result.deviceId).not.toBe('tv-safe-123456');

    const audit = safety.buildTvAuditEntry({
      auditId: 'tv-audit',
      deviceId: 'tv-safe-123456',
      command: 'switch.on',
      requestedAt: new Date().toISOString(),
      status: 'preview',
    });
    expect(audit.tokenExposed).toBe(false);
    expect(audit.restrictedToTv).toBe(true);
  });
});

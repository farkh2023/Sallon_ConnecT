const safety = require('../../server/src/services/media/smartThingsSafety');

const baseConfig = {
  enabled: true,
  token: '',
  readOnly: true,
  allowSceneExecution: false,
  sceneAuditEnabled: true,
  sceneExecutionRequireConfirmation: true,
  sceneExecutionConfirmationCode: 'CONFIRMER',
  sceneAllowlist: 'scene-ok',
  tvCommandsEnabled: false,
  tvAuditEnabled: true,
  tvCommandsRequireConfirmation: true,
  tvConfirmationCode: 'CONFIRMER_TV',
  tvDeviceAllowlist: 'tv-ok',
  tvCommandAllowlist: 'switch.on',
  tvBlockVolumeCommands: true,
  tvBlockKeypadInput: true,
  tvBlockSourceChange: true,
};

describe('SmartThings safety', () => {
  it('flags missing token and never returns token in sanitized payloads', () => {
    const validation = safety.validateSmartThingsConfig(baseConfig);
    expect(validation.valid).toBe(false);
    expect(validation.errors.join(' ')).toMatch(/TOKEN/);

    const sanitized = safety.sanitizeSmartThingsResponse({
      deviceId: 'device-123456789',
      token: 'real-token',
      accessToken: 'real-token',
    });
    expect(sanitized).not.toHaveProperty('token');
    expect(sanitized).not.toHaveProperty('accessToken');
    expect(sanitized.deviceId).not.toBe('device-123456789');
  });

  it('allows read-only operations and blocks write operations', () => {
    expect(() => safety.assertReadOnlyOperation('GET /devices')).not.toThrow();
    expect(() => safety.assertReadOnlyOperation('POST /devices/id/commands')).toThrow(/interdite/);
  });

  it('blocks scene execution unless opt-in, allowlist and confirmation all pass', () => {
    expect(safety.validateSceneExecutionEnabled(baseConfig).valid).toBe(false);
    expect(safety.validateSceneInAllowlist('scene-bad', baseConfig).valid).toBe(false);
    expect(safety.validateConfirmationCode('', baseConfig).valid).toBe(false);

    const enabled = { ...baseConfig, allowSceneExecution: true };
    expect(safety.validateSceneExecutionEnabled(enabled).valid).toBe(true);
    expect(safety.validateSceneInAllowlist('scene-ok', enabled).valid).toBe(true);
    expect(safety.validateConfirmationCode('CONFIRMER', enabled).valid).toBe(true);
  });

  it('builds non-destructive scene preview/audit data without token exposure', () => {
    const audit = safety.buildSceneAuditEntry({
      auditId: 'audit-1',
      sceneId: 'scene-ok-123456',
      sceneName: 'Cinema',
      requestedAt: new Date().toISOString(),
      status: 'preview',
    });

    expect(audit.tokenExposed).toBe(false);
    expect(audit.deviceCommandsUsed).toBe(false);
    expect(audit.sceneIdMasked).not.toContain('scene-ok-123456');
  });
});

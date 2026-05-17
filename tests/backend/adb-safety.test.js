const safety = require('../../server/src/services/media/adbSafety');

describe('ADB safety', () => {
  it('documents read-only allowlist and blocks destructive commands', () => {
    expect(safety.ALLOWED_COMMANDS).toContain('devices');
    expect(safety.validateAdbCommand('devices').valid).toBe(true);
    expect(safety.validateAdbCommand('pull /sdcard/a.jpg .').valid).toBe(false);
    expect(safety.validateAdbCommand('push local remote').valid).toBe(false);
    expect(safety.validateAdbCommand('shell rm /sdcard/a').valid).toBe(false);
    expect(safety.validateAdbCommand('shell ls /data/data').valid).toBe(false);
  });

  it('masks IDs and sanitizes output', () => {
    expect(safety.maskDeviceId('ABCDEF1234567890')).not.toBe('ABCDEF1234567890');
    const sampleImei = ['12345', '67890', '12345'].join('');
    const output = safety.sanitizeAdbOutput(`ABCDEF1234567890 00:11:22:33:44:55 ${sampleImei}`);
    expect(output).not.toContain('ABCDEF1234567890');
    expect(output).not.toContain('00:11:22:33:44:55');
    expect(output).not.toContain(sampleImei);
  });
});

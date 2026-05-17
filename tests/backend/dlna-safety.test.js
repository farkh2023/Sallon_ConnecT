const safety = require('../../server/src/services/media/dlnaSafety');

describe('DLNA safety', () => {
  it('accepts local addresses and refuses public addresses', () => {
    expect(safety.validateDlnaConfig({ enabled: false }).valid).toBe(true);
    expect(safety.isLocalAddress('192.168.1.20')).toBe(true);
    expect(safety.isLocalAddress('8.8.8.8')).toBe(false);
    expect(safety.maskLocalIp('192.168.1.20')).toBe('192.168.*.*');
  });

  it('sanitizes SSDP responses and rejects non-local LOCATION', () => {
    const local = safety.sanitizeSsdpResponse(
      'LOCATION: http://192.168.1.20:8000/root.xml\r\nST: upnp:rootdevice\r\nSERVER: test',
      true
    );
    expect(local.location).toContain('192.168.*.*');

    const publicLocation = safety.sanitizeSsdpResponse('LOCATION: http://8.8.8.8/root.xml\r\nST: test', true);
    expect(publicLocation).not.toHaveProperty('location');
  });

  it('keeps SOAP actions blocked and sanitizes XML descriptions', () => {
    expect(safety.BLOCKED_ACTIONS).toContain('Play');
    expect(safety.BLOCKED_ACTIONS).toContain('SetVolume');

    const xml = '<root><friendlyName>TV</friendlyName><manufacturer>Samsung</manufacturer><X_Token>secret</X_Token><serviceType>urn:schemas-upnp-org:service:AVTransport:1</serviceType></root>';
    const desc = safety.sanitizeDeviceDescription(xml);
    expect(desc.friendlyName).toBe('TV');
    expect(desc.manufacturer).toBe('Samsung');
    expect(JSON.stringify(desc)).not.toContain('secret');
  });
});

const fs = require('fs');
const path = require('path');
const safety = require('../../server/src/services/media/streamingSafety');

describe('streaming safety', () => {
  let dir;
  let smallFile;
  let bigFile;
  let config;

  beforeEach(() => {
    const runtimeDir = path.resolve('tests/.runtime');
    fs.mkdirSync(runtimeDir, { recursive: true });
    dir = fs.mkdtempSync(path.join(runtimeDir, 'sallon-stream-'));
    smallFile = path.join(dir, 'movie.mp4');
    bigFile = path.join(dir, 'large.mp4');
    fs.writeFileSync(smallFile, Buffer.alloc(1024));
    fs.writeFileSync(bigFile, Buffer.alloc(2 * 1024 * 1024));
    config = {
      streaming: {
        enabled: false,
        allowedDir: '',
        allowedExtensions: '.mp4,.mp3',
        maxFileMb: 1,
        requireConfirmation: true,
        confirmationCode: 'CONFIRMER_STREAM',
      },
      dlna: { rendererAllowlist: 'renderer-safe' },
    };
  });

  it('is disabled by default and refuses missing media directory', () => {
    const check = safety.validateStreamingConfig(config);
    expect(check.valid).toBe(false);
    expect(check.errors.join(' ')).toMatch(/Streaming|Dossier/);
  });

  it('blocks traversal, forbidden extensions and oversized files', () => {
    const enabled = { ...config, streaming: { ...config.streaming, enabled: true, allowedDir: dir } };
    expect(safety.validateMediaFilePath(path.join(dir, '..', 'secret.mp4'), enabled).valid).toBe(false);
    expect(safety.validateMediaExtension(path.join(dir, 'bad.exe'), enabled).valid).toBe(false);
    expect(safety.validateMediaSize(bigFile, enabled).valid).toBe(false);
    expect(safety.validateMediaFilePath(smallFile, enabled).valid).toBe(true);
  });

  it('requires allowlisted renderer and confirmation', () => {
    const enabled = { ...config, streaming: { ...config.streaming, enabled: true, allowedDir: dir } };
    expect(safety.validateRendererAllowed('renderer-bad', enabled).valid).toBe(false);
    expect(safety.validateRendererAllowed('renderer-safe', enabled).valid).toBe(true);
    expect(safety.validateStreamingConfirmation('', enabled).valid).toBe(false);
    expect(safety.validateStreamingConfirmation('CONFIRMER_STREAM', enabled).valid).toBe(true);
  });

  it('masks paths and never returns absolute paths in sanitized items', () => {
    expect(safety.maskMediaPath(smallFile)).toBe('movie.mp4');
    const item = safety.sanitizeMediaItem({ title: 'Movie', absolutePath: smallFile, _absolutePath: smallFile });
    expect(item).toEqual({ title: 'Movie' });
    expect(JSON.stringify(item)).not.toContain(dir);
  });
});

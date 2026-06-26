'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const request = require('supertest');

describe('Phase 4.0 media security hardening', () => {
  let tempRoot;
  let videoRoot;
  let photoRoot;
  let app;
  let config;
  let security;

  beforeEach(() => {
    jest.resetModules();

    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sallon-sec40-'));
    videoRoot = path.join(tempRoot, 'videos');
    photoRoot = path.join(tempRoot, 'photos');
    fs.mkdirSync(videoRoot);
    fs.mkdirSync(photoRoot);
    fs.writeFileSync(path.join(videoRoot, 'film.mp4'), Buffer.from('0123456789abcdef'));
    fs.writeFileSync(path.join(photoRoot, 'photo.jpg'), Buffer.from('fake-jpeg'));

    process.env.MEDIA_REAL_ENABLED = 'true';
    process.env.MEDIA_ROOT = videoRoot;
    process.env.MEDIA_PHOTOS_ROOT = photoRoot;
    process.env.MEDIA_ALLOWED_EXTENSIONS = '.mp4,.jpg';
    process.env.MEDIA_PUBLIC_BASE_URL = 'http://localhost:3000';
    process.env.MEDIA_STREAM_RANGE_ENABLED = 'true';
    process.env.TV_PLAYBACK_MODE = 'stub';

    config = require('../../server/src/services/config');
    security = require('../../server/src/media/media-security');

    const mediaRoutes = require('../../server/src/routes/media');
    app = express();
    app.use(express.json());
    app.use('/api/media', mediaRoutes);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(tempRoot, { recursive: true, force: true });
    delete process.env.MEDIA_ROOT;
    delete process.env.MEDIA_PHOTOS_ROOT;
    delete process.env.MEDIA_ALLOWED_EXTENSIONS;
    delete process.env.MEDIA_REAL_ENABLED;
    delete process.env.MEDIA_STREAM_RANGE_ENABLED;
  });

  // ── 1. Symlink réel hors racine exclu de l'index ─────────────────────────

  it('excludes a real symlink from the library scan', async () => {
    const outsideTarget = path.join(tempRoot, 'outside.mp4');
    fs.writeFileSync(outsideTarget, Buffer.from('secret content'));
    const symlinkPath = path.join(videoRoot, 'evil.mp4');

    try {
      fs.symlinkSync(outsideTarget, symlinkPath);
    } catch (e) {
      if (e.code === 'EPERM') {
        // Windows sans droits admin — on vérifie quand même que le chemin hors racine est refusé
        const result = security.validateMediaPath(outsideTarget, config);
        expect(result).toMatchObject({ valid: false, status: 403 });
        return;
      }
      throw e;
    }

    const scan = await request(app).post('/api/media/rescan').expect(200);
    const titles = scan.body.items.map(i => i.title);
    expect(titles).not.toContain('evil.mp4');
    expect(titles).toContain('film.mp4');
  });

  // ── 2. Symlink réel hors racine refusé par validateMediaPath ─────────────

  it('rejects via validateMediaPath a symlink whose real path is outside allowed roots', () => {
    const outsideTarget = path.join(tempRoot, 'secret.mp4');
    fs.writeFileSync(outsideTarget, Buffer.from('top secret'));
    const symlinkPath = path.join(videoRoot, 'link.mp4');

    try {
      fs.symlinkSync(outsideTarget, symlinkPath);
    } catch (e) {
      if (e.code === 'EPERM') {
        // Verify via direct path check instead
        const result = security.validateMediaPath(outsideTarget, config);
        expect(result).toMatchObject({ valid: false, status: 403 });
        return;
      }
      throw e;
    }

    const result = security.validateMediaPath(symlinkPath, config);
    expect(result).toMatchObject({ valid: false, status: 403 });
    expect(result.reason).toBe('Accès média interdit.');
  });

  // ── 3. Extension non autorisée = refus clair (API et fonction) ───────────

  it('refuses an unauthorized extension via validateMediaPath', () => {
    const exePath = path.join(videoRoot, 'virus.exe');
    fs.writeFileSync(exePath, Buffer.from('bad binary'));

    const result = security.validateMediaPath(exePath, config);
    expect(result).toMatchObject({ valid: false, status: 403 });
    expect(result.reason).toMatch(/Extension/);
  });

  it('refuses an unauthorized extension and never indexes the file', async () => {
    fs.writeFileSync(path.join(videoRoot, 'doc.pdf'), Buffer.from('pdf'));
    fs.writeFileSync(path.join(videoRoot, 'archive.zip'), Buffer.from('zip'));

    const scan = await request(app).post('/api/media/rescan').expect(200);
    const extensions = scan.body.items.map(i => i.extension);
    expect(extensions).not.toContain('.pdf');
    expect(extensions).not.toContain('.zip');
    expect(extensions).not.toContain('.exe');
  });

  // ── 4. Fichier normal dans racine = lecture OK ────────────────────────────

  it('streams a normal authorized file without crash', async () => {
    const scan = await request(app).post('/api/media/rescan').expect(200);
    const video = scan.body.items.find(i => i.type === 'video');
    expect(video).toBeDefined();

    const res = await request(app).get(video.streamUrl).expect(200);
    expect(res.headers['content-type']).toMatch(/video\/mp4/);
    expect(res.headers['content-length']).toBe('16');
  });

  it('streams a normal photo without crash', async () => {
    const scan = await request(app).post('/api/media/rescan').expect(200);
    const photo = scan.body.items.find(i => i.type === 'image');
    expect(photo).toBeDefined();

    const res = await request(app).get(photo.streamUrl).expect(200);
    expect(res.headers['content-type']).toMatch(/image\//);
  });

  // ── 5. Fichier supprimé pendant la lecture = pas de crash serveur ─────────

  it('returns 404 when file is deleted before the stream begins', async () => {
    const scan = await request(app).post('/api/media/rescan').expect(200);
    const video = scan.body.items.find(i => i.type === 'video');

    fs.unlinkSync(path.join(videoRoot, 'film.mp4'));

    const res = await request(app).get(video.streamUrl).expect(404);
    expect(res.body).toMatchObject({ ok: false, error: 'Fichier média introuvable.' });
    // Chemin local non exposé
    expect(JSON.stringify(res.body)).not.toContain(tempRoot);
  });

  it('returns 500 and no crash when read stream emits a mid-read I/O error', async () => {
    const { PassThrough } = require('stream');
    const scan = await request(app).post('/api/media/rescan').expect(200);
    const video = scan.body.items.find(i => i.type === 'video');

    const fsModule = require('fs');
    jest.spyOn(fsModule, 'createReadStream').mockImplementation(() => {
      const s = new PassThrough();
      process.nextTick(() => {
        const err = new Error('disk I/O failure');
        err.code = 'EIO';
        s.emit('error', err);
      });
      return s;
    });

    const res = await request(app).get(video.streamUrl).expect(500);
    expect(res.body).toMatchObject({ ok: false, error: 'Erreur de lecture du média.' });
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(JSON.stringify(res.body)).not.toContain(tempRoot);
  });

  // ── 6. validateMediaPath retourne le vrai chemin résolu ──────────────────

  it('returns realFilePath pointing inside the allowed root for a valid file', () => {
    const filePath = path.join(videoRoot, 'film.mp4');
    const result = security.validateMediaPath(filePath, config);

    expect(result.valid).toBe(true);
    expect(result.realFilePath).toBeDefined();
    expect(result.realFilePath).toContain('film.mp4');

    const realRoots = security.getRealAllowedRoots(security.getAllowedRoots(config));
    expect(realRoots.some(r => result.realFilePath.startsWith(r))).toBe(true);
  });
});

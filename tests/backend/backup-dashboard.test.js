'use strict';

const request = require('supertest');

// Mock backupScriptRunner before requiring app so routes use the mock.
// Return shapes must match what the real runner functions return (already-parsed objects).
jest.mock('../../server/src/services/backupDashboard/backupScriptRunner', () => ({
  runListBackups: jest.fn().mockResolvedValue({
    snapshots: [
      {
        id: '20240101-120000',
        timestamp: '2024-01-01T12:00:00.000Z',
        type: 'quick',
        description: 'Test snapshot',
        fileCount: 5,
        totalSizeKB: 200,
        valid: true,
        hasChecksum: true,
        hasReport: true,
      },
    ],
    total: 1,
  }),
  runCreateBackup: jest.fn().mockResolvedValue({ stdout: 'OK', stderr: '', exitCode: 0 }),
  runVerifyBackup: jest.fn().mockResolvedValue({
    ok: true,
    results: [{ file: 'VERSION', status: 'valid' }],
  }),
  runExportBackup: jest.fn().mockResolvedValue({ ok: true }),
  runDeleteBackup: jest.fn().mockResolvedValue({ ok: true }),
}));

const { app } = require('../../server');

// -----------------------------------------------------------------------
// Safety endpoint
// -----------------------------------------------------------------------
describe('GET /api/backups/safety', () => {
  it('returns safety flags', async () => {
    const res = await request(app).get('/api/backups/safety');
    expect(res.status).toBe(200);
    expect(res.body.localOnly).toBe(true);
    expect(res.body.noCloud).toBe(true);
    expect(res.body.restoreRequiresManualConfirmation).toBe(true);
    expect(res.body.deleteRequiresConfirmation).toBe(true);
    expect(res.body.secretsExcluded).toBe(true);
    expect(res.body.envExcluded).toBe(true);
  });

  it('response must not contain C:\\Users\\', async () => {
    const res = await request(app).get('/api/backups/safety');
    const body = JSON.stringify(res.body);
    expect(body).not.toMatch(/C:\\Users\\/i);
  });
});

// -----------------------------------------------------------------------
// Dashboard
// -----------------------------------------------------------------------
describe('GET /api/backups/dashboard', () => {
  it('returns summary and items', async () => {
    const res = await request(app).get('/api/backups/dashboard');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('summary');
    expect(res.body).toHaveProperty('items');
    expect(res.body.summary.total).toBeGreaterThanOrEqual(0);
  });

  it('response must not contain .env content or token', async () => {
    const res = await request(app).get('/api/backups/dashboard');
    const body = JSON.stringify(res.body);
    expect(body).not.toMatch(/Bearer\s+\S/);
    expect(body).not.toMatch(/\.env\s*=/);
  });
});

// -----------------------------------------------------------------------
// List
// -----------------------------------------------------------------------
describe('GET /api/backups/list', () => {
  it('returns items array in body', async () => {
    const res = await request(app).get('/api/backups/list');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
  });
});

// -----------------------------------------------------------------------
// Create
// -----------------------------------------------------------------------
describe('POST /api/backups/create', () => {
  it('creates a quick backup', async () => {
    const res = await request(app)
      .post('/api/backups/create')
      .send({ type: 'quick', exportZip: false });
    expect([200, 201]).toContain(res.status);
    expect(res.body.ok).toBe(true);
  });

  it('creates a full backup', async () => {
    const res = await request(app)
      .post('/api/backups/create')
      .send({ type: 'full', exportZip: false });
    expect([200, 201]).toContain(res.status);
    expect(res.body.ok).toBe(true);
  });

  it('rejects invalid type', async () => {
    const res = await request(app)
      .post('/api/backups/create')
      .send({ type: 'invalid', exportZip: false });
    expect(res.status).toBe(400);
  });
});

// -----------------------------------------------------------------------
// Verify
// -----------------------------------------------------------------------
describe('POST /api/backups/:id/verify', () => {
  it('verifies a valid snapshot id', async () => {
    const res = await request(app).post('/api/backups/20240101-120000/verify');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('rejects id with path traversal', async () => {
    const res = await request(app).post('/api/backups/..%2Fetc%2Fpasswd/verify');
    expect(res.status).toBe(400);
  });

  it('rejects id with backslash', async () => {
    const res = await request(app).post('/api/backups/foo%5Cbar/verify');
    expect(res.status).toBe(400);
  });
});

// -----------------------------------------------------------------------
// Export
// -----------------------------------------------------------------------
describe('POST /api/backups/:id/export', () => {
  it('exports a valid snapshot', async () => {
    const res = await request(app).post('/api/backups/20240101-120000/export');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

// -----------------------------------------------------------------------
// Delete — requires confirmation
// -----------------------------------------------------------------------
describe('DELETE /api/backups/:id', () => {
  it('rejects deletion without confirmation', async () => {
    const res = await request(app)
      .delete('/api/backups/20240101-120000')
      .send({});
    expect(res.status).toBe(400);
  });

  it('rejects deletion with wrong confirmation', async () => {
    const res = await request(app)
      .delete('/api/backups/20240101-120000')
      .send({ confirmation: 'oui' });
    expect(res.status).toBe(400);
  });

  it('accepts deletion with correct confirmation', async () => {
    const res = await request(app)
      .delete('/api/backups/20240101-120000')
      .send({ confirmation: 'SUPPRIMER' });
    expect([200, 204]).toContain(res.status);
  });

  it('rejects id with double-dot (Express normalizes path, so it routes elsewhere)', async () => {
    // Express normalizes /api/backups/../secret → /api/secret → no route → 404
    // The actual protection is the sanitizeBackupId regex on the :id param
    const res = await request(app)
      .delete('/api/backups/../secret')
      .send({ confirmation: 'SUPPRIMER' });
    expect([400, 404]).toContain(res.status);
  });

  it('rejects id with slash', async () => {
    const res = await request(app)
      .delete('/api/backups/foo%2Fbar')
      .send({ confirmation: 'SUPPRIMER' });
    expect(res.status).toBe(400);
  });
});

// -----------------------------------------------------------------------
// Restore prepare — NEVER auto-restores
// -----------------------------------------------------------------------
describe('POST /api/backups/:id/restore/prepare', () => {
  it('returns command but does NOT restore', async () => {
    const res = await request(app).post('/api/backups/20240101-120000/restore/prepare');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.command).toMatch(/restore-backup\.ps1/);
    expect(res.body.noAutoRestore).toBe(true);
    expect(res.body.localOnly).toBe(true);
  });

  it('response must not contain C:\\Users\\ path', async () => {
    const res = await request(app).post('/api/backups/20240101-120000/restore/prepare');
    const body = JSON.stringify(res.body);
    expect(body).not.toMatch(/C:\\Users\\/i);
  });
});

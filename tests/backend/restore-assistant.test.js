'use strict';

const request = require('supertest');

const VALID_ID = '20240101-120000';

const MOCK_ASSISTANT = {
  snapshotId: VALID_ID,
  status:     'ready',
  snapshot: {
    id: VALID_ID, timestamp: '2024-01-01T12:00:00.000Z',
    type: 'quick', description: 'Test', fileCount: 3,
    totalSizeKB: 50, version: '0.4.0', valid: true,
  },
  integrity: {
    ok: true,
    results: [{ snapshotId: VALID_ID, status: 'valid', verified: ['VERSION'], missing: [], corrupted: [] }],
  },
  dryRun: {
    status: 'ok', snapshotId: VALID_ID,
    wouldRestore: ['VERSION', 'package.json'], wouldReplace: ['VERSION'],
    wouldKeep: ['node_modules/'], excluded: ['.env (jamais copie)'],
    preRestoreBackup: { willBeCreated: true, type: 'quick' },
    warnings: [], blockedReasons: [],
  },
  risk: { level: 'low', score: 5, reasons: ['Backup rapide.'], blockingReasons: [] },
  checklist: [
    { id: 'verified', label: 'J\'ai verifie', checked: false },
  ],
  manualCommand: `.\\scripts\\windows\\backup\\restore-backup.ps1 -SnapshotId ${VALID_ID}`,
  safety: {
    manualOnly: true, noAutoRestore: true, noApiExecution: true,
    requiresPowerShell: true, message: 'La restauration ne peut pas etre effectuee automatiquement via le dashboard.',
  },
};

const MOCK_DRY_RUN = MOCK_ASSISTANT.dryRun;
const MOCK_RISK    = MOCK_ASSISTANT.risk;
const MOCK_COMMAND = {
  manualOnly: true,
  command: `.\\scripts\\windows\\backup\\restore-backup.ps1 -SnapshotId ${VALID_ID}`,
  note: 'Cette commande doit etre executee manuellement dans PowerShell.',
  safety: MOCK_ASSISTANT.safety,
};

jest.mock('../../server/src/services/backupDashboard/restoreAssistantService', () => ({
  getAssistantData: jest.fn().mockResolvedValue(MOCK_ASSISTANT),
  getDryRun:        jest.fn().mockResolvedValue(MOCK_DRY_RUN),
  getRisk:          jest.fn().mockResolvedValue(MOCK_RISK),
  getManualCommand: jest.fn().mockReturnValue(MOCK_COMMAND),
}));

jest.mock('../../server/src/services/backupDashboard/backupScriptRunner', () => ({
  runListBackups:  jest.fn().mockResolvedValue({ snapshots: [], total: 0 }),
  runCreateBackup: jest.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 }),
  runVerifyBackup: jest.fn().mockResolvedValue({ ok: true, results: [] }),
  runExportBackup: jest.fn().mockResolvedValue({ ok: true }),
  runDeleteBackup: jest.fn().mockResolvedValue({ ok: true }),
}));

const { app } = require('../../server');

// -----------------------------------------------------------------------
// GET /api/backups/:id/restore/assistant
// -----------------------------------------------------------------------
describe('GET /api/backups/:id/restore/assistant', () => {
  it('returns assistant data for valid id', async () => {
    const res = await request(app).get(`/api/backups/${VALID_ID}/restore/assistant`);
    expect(res.status).toBe(200);
    expect(res.body.snapshotId).toBe(VALID_ID);
    expect(['ready', 'blocked']).toContain(res.body.status);
    expect(res.body).toHaveProperty('risk');
    expect(res.body).toHaveProperty('checklist');
    expect(res.body).toHaveProperty('safety');
  });

  it('safety flags are all set', async () => {
    const res = await request(app).get(`/api/backups/${VALID_ID}/restore/assistant`);
    expect(res.body.safety.manualOnly).toBe(true);
    expect(res.body.safety.noAutoRestore).toBe(true);
    expect(res.body.safety.noApiExecution).toBe(true);
  });

  it('manualCommand contains restore-backup.ps1', async () => {
    const res = await request(app).get(`/api/backups/${VALID_ID}/restore/assistant`);
    expect(res.body.manualCommand).toMatch(/restore-backup\.ps1/);
  });

  it('rejects id with ..', async () => {
    const res = await request(app).get('/api/backups/..%2Fetc/restore/assistant');
    expect(res.status).toBe(400);
  });

  it('rejects id with slash', async () => {
    const res = await request(app).get('/api/backups/foo%2Fbar/restore/assistant');
    expect(res.status).toBe(400);
  });

  it('rejects id with backslash', async () => {
    const res = await request(app).get('/api/backups/foo%5Cbar/restore/assistant');
    expect(res.status).toBe(400);
  });

  it('response does not contain C:\\Users\\', async () => {
    const res = await request(app).get(`/api/backups/${VALID_ID}/restore/assistant`);
    expect(JSON.stringify(res.body)).not.toMatch(/C:\\Users\\/i);
  });

  it('response does not contain .env=', async () => {
    const res = await request(app).get(`/api/backups/${VALID_ID}/restore/assistant`);
    expect(JSON.stringify(res.body)).not.toMatch(/\.env\s*=/);
  });

  it('response does not contain Bearer token', async () => {
    const res = await request(app).get(`/api/backups/${VALID_ID}/restore/assistant`);
    expect(JSON.stringify(res.body)).not.toMatch(/Bearer\s+\S/);
  });
});

// -----------------------------------------------------------------------
// POST /api/backups/:id/restore/dry-run
// -----------------------------------------------------------------------
describe('POST /api/backups/:id/restore/dry-run', () => {
  it('returns dry-run result', async () => {
    const res = await request(app).post(`/api/backups/${VALID_ID}/restore/dry-run`);
    expect(res.status).toBe(200);
    expect(res.body.snapshotId).toBe(VALID_ID);
    expect(Array.isArray(res.body.wouldRestore)).toBe(true);
    expect(Array.isArray(res.body.wouldReplace)).toBe(true);
    expect(Array.isArray(res.body.wouldKeep)).toBe(true);
    expect(Array.isArray(res.body.excluded)).toBe(true);
    expect(res.body.preRestoreBackup.willBeCreated).toBe(true);
  });

  it('rejects id with ..', async () => {
    const res = await request(app).post('/api/backups/..%2Fsecret/restore/dry-run');
    expect(res.status).toBe(400);
  });

  it('response does not contain C:\\Users\\', async () => {
    const res = await request(app).post(`/api/backups/${VALID_ID}/restore/dry-run`);
    expect(JSON.stringify(res.body)).not.toMatch(/C:\\Users\\/i);
  });
});

// -----------------------------------------------------------------------
// POST /api/backups/:id/restore/risk
// -----------------------------------------------------------------------
describe('POST /api/backups/:id/restore/risk', () => {
  it('returns risk with level field', async () => {
    const res = await request(app).post(`/api/backups/${VALID_ID}/restore/risk`);
    expect(res.status).toBe(200);
    expect(['low', 'medium', 'high', 'blocked']).toContain(res.body.level);
    expect(typeof res.body.score).toBe('number');
    expect(Array.isArray(res.body.reasons)).toBe(true);
    expect(Array.isArray(res.body.blockingReasons)).toBe(true);
  });

  it('rejects id with backslash', async () => {
    const res = await request(app).post('/api/backups/foo%5Cbar/restore/risk');
    expect(res.status).toBe(400);
  });

  it('response does not contain C:\\Users\\', async () => {
    const res = await request(app).post(`/api/backups/${VALID_ID}/restore/risk`);
    expect(JSON.stringify(res.body)).not.toMatch(/C:\\Users\\/i);
  });
});

// -----------------------------------------------------------------------
// GET /api/backups/:id/restore/command
// -----------------------------------------------------------------------
describe('GET /api/backups/:id/restore/command', () => {
  it('returns manualOnly:true and command string', async () => {
    const res = await request(app).get(`/api/backups/${VALID_ID}/restore/command`);
    expect(res.status).toBe(200);
    expect(res.body.manualOnly).toBe(true);
    expect(res.body.command).toMatch(/restore-backup\.ps1/);
    expect(res.body.command).toMatch(new RegExp(VALID_ID));
    expect(res.body.note).toBeTruthy();
  });

  it('command does not contain C:\\Users\\', async () => {
    const res = await request(app).get(`/api/backups/${VALID_ID}/restore/command`);
    expect(JSON.stringify(res.body)).not.toMatch(/C:\\Users\\/i);
  });

  it('rejects id with ..', async () => {
    const res = await request(app).get('/api/backups/..%2Fetc/restore/command');
    expect(res.status).toBe(400);
  });
});

// -----------------------------------------------------------------------
// Security — restore-backup.ps1 never executed via API
// -----------------------------------------------------------------------
describe('Security — no restore execution', () => {
  it('runner has no runRestoreBackup function', () => {
    const runner = require('../../server/src/services/backupDashboard/backupScriptRunner');
    expect(runner.runRestoreBackup).toBeUndefined();
  });

  it('safety message explicitly says no auto restore', async () => {
    const res = await request(app).get(`/api/backups/${VALID_ID}/restore/assistant`);
    const safetyStr = JSON.stringify(res.body.safety);
    expect(safetyStr).toMatch(/manualOnly|noAutoRestore/);
  });

  it('blocked snapshot id returns 400 not 500', async () => {
    const res = await request(app).get('/api/backups/x!invalid/restore/assistant');
    expect(res.status).toBe(400);
  });
});

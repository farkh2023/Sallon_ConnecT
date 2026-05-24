'use strict';

/**
 * security-masking.test.js
 * Valide les 3 invariants de securite sur toutes les routes backup + restore :
 *   1. Bearer token masque dans toute reponse
 *   2. C:\Users\ absent de toute reponse
 *   3. IDs avec .., /, \ rejetes avec 400
 */

// ---------- mocks ----------------------------------------------------------

jest.mock('../../server/src/services/backupDashboard/backupScriptRunner', () => ({
  runListBackups:  jest.fn().mockResolvedValue({ snapshots: [], total: 0 }),
  runCreateBackup: jest.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 }),
  runVerifyBackup: jest.fn().mockResolvedValue({ ok: true, results: [] }),
  runExportBackup: jest.fn().mockResolvedValue({ ok: true }),
  runDeleteBackup: jest.fn().mockResolvedValue({ ok: true }),
}));

jest.mock('../../server/src/services/backupDashboard/restoreAssistantService', () => ({
  getAssistantData: jest.fn().mockResolvedValue({
    snapshotId: '20240101-120000',
    status: 'ready',
    snapshot: { id: '20240101-120000', valid: true, type: 'quick', timestamp: '2024-01-01T12:00:00Z', fileCount: 3, totalSizeKB: 50, version: '0.4.0', description: 'Test' },
    integrity: { ok: true, results: [] },
    dryRun: { status: 'ok', snapshotId: '20240101-120000', wouldRestore: [], wouldReplace: [], wouldKeep: [], excluded: [], preRestoreBackup: { willBeCreated: true, type: 'quick' }, warnings: [], blockedReasons: [] },
    risk: { level: 'low', score: 5, reasons: [], blockingReasons: [] },
    checklist: [],
    manualCommand: '.\\scripts\\windows\\backup\\restore-backup.ps1 -SnapshotId 20240101-120000',
    safety: { manualOnly: true, noAutoRestore: true, noApiExecution: true, requiresPowerShell: true, message: 'Manuelle uniquement.' },
  }),
  getDryRun:        jest.fn().mockResolvedValue({ status: 'ok', snapshotId: '20240101-120000', wouldRestore: [], wouldReplace: [], wouldKeep: [], excluded: [], preRestoreBackup: { willBeCreated: true, type: 'quick' }, warnings: [], blockedReasons: [] }),
  getRisk:          jest.fn().mockResolvedValue({ level: 'low', score: 5, reasons: [], blockingReasons: [] }),
  getManualCommand: jest.fn().mockReturnValue({ manualOnly: true, command: '.\\scripts\\windows\\backup\\restore-backup.ps1 -SnapshotId 20240101-120000', note: 'Manuelle.' }),
}));

const { app } = require('../../server');
const request  = require('supertest');

const VALID_ID = '20240101-120000';

// ---------- routes a tester -----------------------------------------------

const GET_ROUTES = [
  `/api/backups/safety`,
  `/api/backups/dashboard`,
  `/api/backups/list`,
  `/api/backups/${VALID_ID}/restore/assistant`,
  `/api/backups/${VALID_ID}/restore/command`,
];

const POST_ROUTES = [
  { url: `/api/backups/create`,                  body: { type: 'quick', exportZip: false } },
  { url: `/api/backups/${VALID_ID}/verify`,       body: {} },
  { url: `/api/backups/${VALID_ID}/export`,       body: {} },
  { url: `/api/backups/${VALID_ID}/restore/dry-run`, body: {} },
  { url: `/api/backups/${VALID_ID}/restore/risk`, body: {} },
];

// ---------- IDs invalides ---------------------------------------------------

const INVALID_IDS = [
  { raw: '../secret',            encoded: '..%2Fsecret',     description: 'double-dot + slash' },
  { raw: 'foo/bar',              encoded: 'foo%2Fbar',       description: 'slash' },
  { raw: 'foo\\bar',             encoded: 'foo%5Cbar',       description: 'backslash' },
  { raw: 'x!invalid',            encoded: 'x!invalid',       description: 'special char !' },
  { raw: '../../../etc/passwd',  encoded: '..%2F..%2F..%2Fetc%2Fpasswd', description: 'path traversal profond' },
];

// ---------- invariant 1 : Bearer absent ------------------------------------

describe('Securite — Bearer absent de toutes les reponses', () => {
  for (const url of GET_ROUTES) {
    it(`GET ${url}`, async () => {
      const res = await request(app).get(url);
      expect(JSON.stringify(res.body)).not.toMatch(/Bearer\s+[A-Za-z0-9]/i);
    });
  }

  for (const { url, body } of POST_ROUTES) {
    it(`POST ${url}`, async () => {
      const res = await request(app).post(url).send(body);
      expect(JSON.stringify(res.body)).not.toMatch(/Bearer\s+[A-Za-z0-9]/i);
    });
  }
});

// ---------- invariant 2 : C:\Users\ absent ---------------------------------

describe('Securite — C:\\Users\\ absent de toutes les reponses', () => {
  for (const url of GET_ROUTES) {
    it(`GET ${url}`, async () => {
      const res = await request(app).get(url);
      expect(JSON.stringify(res.body)).not.toMatch(/C:\\Users\\/i);
    });
  }

  for (const { url, body } of POST_ROUTES) {
    it(`POST ${url}`, async () => {
      const res = await request(app).post(url).send(body);
      expect(JSON.stringify(res.body)).not.toMatch(/C:\\Users\\/i);
    });
  }
});

// ---------- invariant 3 : IDs invalides rejetes 400 -----------------------

describe('Securite — snapshotId invalide rejeté 400', () => {
  for (const { encoded, description } of INVALID_IDS) {
    it(`GET /restore/assistant id="${description}"`, async () => {
      const res = await request(app).get(`/api/backups/${encoded}/restore/assistant`);
      expect(res.status).toBe(400);
    });

    it(`POST /restore/dry-run id="${description}"`, async () => {
      const res = await request(app).post(`/api/backups/${encoded}/restore/dry-run`).send({});
      expect(res.status).toBe(400);
    });

    it(`POST /restore/risk id="${description}"`, async () => {
      const res = await request(app).post(`/api/backups/${encoded}/restore/risk`).send({});
      expect(res.status).toBe(400);
    });

    it(`GET /restore/command id="${description}"`, async () => {
      const res = await request(app).get(`/api/backups/${encoded}/restore/command`);
      expect(res.status).toBe(400);
    });

    it(`POST /verify id="${description}"`, async () => {
      const res = await request(app).post(`/api/backups/${encoded}/verify`);
      expect(res.status).toBe(400);
    });

    it(`DELETE id="${description}"`, async () => {
      const res = await request(app).delete(`/api/backups/${encoded}`).send({ confirmation: 'SUPPRIMER' });
      expect([400, 404]).toContain(res.status);
    });
  }
});

// ---------- invariant 4 : masquage actif des fonctions --------------------

describe('Securite — fonctions de masquage directes', () => {
  const { maskBackupPath } = require('../../server/src/services/backupDashboard/backupDashboardSafety');
  const { maskRestorePath } = require('../../server/src/services/backupDashboard/restoreAssistantSafety');

  it('maskBackupPath masque C:\\Users\\username\\', () => {
    const input = 'chemin : C:\\Users\\Youss\\Sallon_ConnecT\\data';
    expect(maskBackupPath(input)).not.toMatch(/C:\\Users\\Youss\\/);
    expect(maskBackupPath(input)).toContain('<user>\\');
  });

  it('maskBackupPath masque Bearer token', () => {
    const input = 'Authorization: Bearer eyJhbGciOiJSUzI1NiJ9.payload.sig';
    const result = maskBackupPath(input);
    expect(result).not.toMatch(/Bearer\s+eyJ/);
    expect(result).toContain('Bearer <masked>');
  });

  it('maskRestorePath masque C:\\Users\\username\\', () => {
    const input = 'C:\\Users\\Youss\\Sallon_ConnecT\\backups';
    expect(maskRestorePath(input)).not.toMatch(/C:\\Users\\Youss\\/);
    expect(maskRestorePath(input)).toContain('<user>\\');
  });

  it('maskRestorePath masque Bearer token', () => {
    const input = 'Bearer eyJhbGciOiJSUzI1NiJ9.payload.sig';
    const result = maskRestorePath(input);
    expect(result).not.toMatch(/Bearer\s+eyJ/);
    expect(result).toContain('Bearer <masked>');
  });

  it('validateSnapshotId rejette ..', () => {
    const { validateSnapshotId } = require('../../server/src/services/backupDashboard/restoreAssistantSafety');
    expect(validateSnapshotId('..')).toBeNull();
    expect(validateSnapshotId('../secret')).toBeNull();
    expect(validateSnapshotId('foo/../bar')).toBeNull();
  });

  it('validateSnapshotId rejette /', () => {
    const { validateSnapshotId } = require('../../server/src/services/backupDashboard/restoreAssistantSafety');
    expect(validateSnapshotId('foo/bar')).toBeNull();
    expect(validateSnapshotId('/etc/passwd')).toBeNull();
  });

  it('validateSnapshotId rejette \\', () => {
    const { validateSnapshotId } = require('../../server/src/services/backupDashboard/restoreAssistantSafety');
    expect(validateSnapshotId('foo\\bar')).toBeNull();
  });

  it('validateSnapshotId accepte un ID valide', () => {
    const { validateSnapshotId } = require('../../server/src/services/backupDashboard/restoreAssistantSafety');
    expect(validateSnapshotId('20240101-120000')).toBe('20240101-120000');
    expect(validateSnapshotId('snap_v1.2-ok')).toBe('snap_v1.2-ok');
  });

  it('sanitizeBackupId rejette .. / \\', () => {
    const { sanitizeBackupId } = require('../../server/src/services/backupDashboard/backupDashboardSafety');
    expect(sanitizeBackupId('..')).toBeNull();
    expect(sanitizeBackupId('foo/bar')).toBeNull();
    expect(sanitizeBackupId('foo\\bar')).toBeNull();
  });
});

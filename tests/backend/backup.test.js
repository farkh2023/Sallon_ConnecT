'use strict';

const request = require('supertest');

process.env.BACKUP_ENABLED = 'true';
process.env.BACKUP_CONFIRMATION_CODE = 'CONFIRMER_BACKUP';
process.env.BACKUP_RESTORE_DRY_RUN_REQUIRED = 'true';
process.env.BACKUP_ROLLBACK_ENABLED = 'false';
process.env.BACKUP_STORE_DIR = 'backups';

const { app } = require('../../server');

describe('GET /api/backup/status', () => {
  it('returns backup status with expected fields', async () => {
    const res = await request(app).get('/api/backup/status');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('enabled');
    expect(res.body).toHaveProperty('rollbackEnabled');
    expect(res.body).toHaveProperty('dryRunRequired');
    expect(res.body).toHaveProperty('confirmationRequired');
    expect(res.body).toHaveProperty('backupDirMasked');
    expect(res.body.backupDirMasked).not.toContain('C:\\Users');
  });
});

describe('GET /api/backup/safety', () => {
  it('returns localOnly=true and cloudSync=false', async () => {
    const res = await request(app).get('/api/backup/safety');
    expect(res.status).toBe(200);
    expect(res.body.localOnly).toBe(true);
    expect(res.body.cloudSync).toBe(false);
    expect(res.body.envExcluded).toBe(true);
    expect(res.body.secretsExcluded).toBe(true);
    expect(Array.isArray(res.body.forbiddenPaths)).toBe(true);
  });
});

describe('GET /api/backup/backups', () => {
  it('returns an array of backups', async () => {
    const res = await request(app).get('/api/backup/backups');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.backups)).toBe(true);
  });
});

describe('POST /api/backup/create', () => {
  let createdBackupId;

  it('creates a backup safely', async () => {
    const res = await request(app)
      .post('/api/backup/create')
      .send({ includeRuntimeSafe: true, includeAudits: false, includeLogs: false, reason: 'Test backup' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.backupId).toBeTruthy();
    expect(res.body.fileName).toMatch(/\.zip$/);
    expect(res.body.filePath).not.toContain('C:\\Users');
    createdBackupId = res.body.backupId;
  });

  it('manifest does not expose absolute paths or secrets', async () => {
    if (!createdBackupId) return;
    const res = await request(app).get(`/api/backup/backups/${createdBackupId}/manifest`);
    expect(res.status).toBe(200);
    const manifest = res.body.manifest;
    expect(manifest).toBeTruthy();
    expect(JSON.stringify(manifest)).not.toMatch(/C:\\Users/);
    expect(JSON.stringify(manifest)).not.toMatch(/node_modules/);
    expect(manifest.security.envExcluded).toBe(true);
    expect(manifest.security.nodeModulesExcluded).toBe(true);
  });

  it('verifies backup integrity', async () => {
    if (!createdBackupId) return;
    const res = await request(app).post(`/api/backup/backups/${createdBackupId}/verify`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('valid');
    expect(Array.isArray(res.body.issues)).toBe(true);
  });

  it('dry-run restore returns expected fields', async () => {
    if (!createdBackupId) return;
    const res = await request(app).post(`/api/backup/backups/${createdBackupId}/restore/dry-run`);
    expect(res.status).toBe(200);
    expect(res.body.dryRun).toBe(true);
    expect(Array.isArray(res.body.willRestore)).toBe(true);
    expect(Array.isArray(res.body.conflicts)).toBe(true);
    expect(res.body.confirmationRequired).toBe(true);
  });

  it('restore refused without confirmation code', async () => {
    if (!createdBackupId) return;
    const res = await request(app)
      .post(`/api/backup/backups/${createdBackupId}/restore`)
      .send({ confirmationCode: 'WRONG_CODE' });
    expect([403, 400]).toContain(res.status);
    expect(res.body.error || res.body.refused).toBeTruthy();
  });

  it('restore refused if dry-run was not completed first', async () => {
    // Get a fresh backup ID that hasn't had dry-run
    const createRes = await request(app)
      .post('/api/backup/create')
      .send({ includeRuntimeSafe: false, includeAudits: false, includeLogs: false, reason: 'Test no dryrun' });
    const freshId = createRes.body.backupId;
    if (!freshId) return;

    const res = await request(app)
      .post(`/api/backup/backups/${freshId}/restore`)
      .send({ confirmationCode: 'CONFIRMER_BACKUP' });
    expect([403, 400]).toContain(res.status);
    expect(res.body.dryRunRequired || res.body.refused || res.body.error).toBeTruthy();
  });

  it('lists backup after creation', async () => {
    const res = await request(app).get('/api/backup/backups');
    expect(res.status).toBe(200);
    if (createdBackupId) {
      const found = res.body.backups.find((b) => b.backupId === createdBackupId);
      expect(found).toBeTruthy();
    }
  });

  it('audit records backup creation event', async () => {
    const res = await request(app).get('/api/backup/audit');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.audit)).toBe(true);
    const created = res.body.audit.find((e) => e.event === 'backup.created');
    expect(created).toBeTruthy();
  });

  it('deletes backup', async () => {
    if (!createdBackupId) return;
    const res = await request(app).delete(`/api/backup/backups/${createdBackupId}`);
    expect(res.status).toBe(200);
    expect(res.body.deleted).toBe(true);
  });
});

describe('Forbidden paths safety', () => {
  it('backupSafety blocks .env path', () => {
    const { isForbiddenPath } = require('../../server/src/services/backup/backupSafety');
    expect(isForbiddenPath('.env')).toBe(true);
    expect(isForbiddenPath('.env.local')).toBe(true);
    expect(isForbiddenPath('node_modules/lodash/index.js')).toBe(true);
    expect(isForbiddenPath('.git/config')).toBe(true);
    expect(isForbiddenPath('data/devices.json')).toBe(false);
    expect(isForbiddenPath('README.md')).toBe(false);
  });
});

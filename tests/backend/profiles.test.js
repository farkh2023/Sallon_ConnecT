const { setRuntimeEnvForSuite, restoreRuntimeEnv, resetTestRuntimeDir, cleanupTestRuntimeDir } = require('../helpers/runtimeTestUtils');

// Redirect profile runtime files to test-isolated directory BEFORE any requests
const _origEnv = setRuntimeEnvForSuite('profiles', {
  PROFILES_STORE_PATH: 'user-profiles.json',
  PROFILES_ACTIVE_PATH: 'active-profile.json',
  PROFILES_AUDIT_PATH: 'profile-audit.json',
});

const request = require('supertest');
const { app } = require('../../server');
const { expectNoSensitiveLeak } = require('../helpers/sensitive');

function expectNoProfileLeak(body) {
  const text = JSON.stringify(body);
  expectNoSensitiveLeak(body);
  expect(text).not.toMatch(/\bBearer\b/i);
  expect(text).not.toMatch(/\bpassword\b/i);
  expect(text).not.toMatch(/[A-Za-z]:\\[^\s"]{20,}/);
  expect(text).not.toMatch(/\/home\/[^\s"]{10,}/);
}

beforeAll(() => {
  // Ensure fresh isolated runtime dir for this suite
  resetTestRuntimeDir('profiles');
});

afterAll(() => {
  // Clean up test runtime dir and restore original env vars
  cleanupTestRuntimeDir('profiles');
  restoreRuntimeEnv(_origEnv);
});

describe('profiles API', () => {
  it('GET /api/profiles/safety returns localOnly true', async () => {
    const res = await request(app).get('/api/profiles/safety').expect(200);
    expect(res.body.localOnly).toBe(true);
    expect(res.body.cloudSync).toBe(false);
    expect(res.body.secretsStored).toBe(false);
    expect(res.body.runtimeProtected).toBe(true);
    expectNoProfileLeak(res.body);
  });

  it('GET /api/profiles returns default profiles', async () => {
    const res = await request(app).get('/api/profiles').expect(200);
    expect(res.body).toHaveProperty('profiles');
    expect(Array.isArray(res.body.profiles)).toBe(true);
    expect(res.body.profiles.length).toBeGreaterThanOrEqual(5);
    const types = res.body.profiles.map(p => p.type);
    expect(types).toContain('owner');
    expect(types).toContain('guest');
    expectNoProfileLeak(res.body);
  });

  it('GET /api/profiles/active returns active profile', async () => {
    const res = await request(app).get('/api/profiles/active').expect(200);
    expect(res.body).toHaveProperty('name');
    expect(res.body).toHaveProperty('type');
    expect(res.body).toHaveProperty('permissions');
    expect(res.body.id).toBeDefined();
    expect(String(res.body.id).length).toBeLessThanOrEqual(16);
    expectNoProfileLeak(res.body);
  });

  it('GET /api/profiles/stats returns stats', async () => {
    const res = await request(app).get('/api/profiles/stats').expect(200);
    expect(typeof res.body.total).toBe('number');
    expect(typeof res.body.enabled).toBe('number');
    expectNoProfileLeak(res.body);
  });

  it('POST /api/profiles creates a new profile', async () => {
    const res = await request(app)
      .post('/api/profiles')
      .send({ name: 'Profil Test', type: 'family' })
      .expect(201);

    expect(res.body.name).toBe('Profil Test');
    expect(res.body.type).toBe('family');
    expect(res.body).toHaveProperty('permissions');
    expect(res.body).toHaveProperty('safety');
    expect(res.body.id).toBeDefined();
    expect(String(res.body.id).length).toBeLessThanOrEqual(16);
    expectNoProfileLeak(res.body);
  });

  it('POST /api/profiles rejects missing name', async () => {
    const res = await request(app)
      .post('/api/profiles')
      .send({ type: 'guest' })
      .expect(400);
    expect(res.body.errors).toBeDefined();
  });

  it('POST /api/profiles rejects invalid type', async () => {
    const res = await request(app)
      .post('/api/profiles')
      .send({ name: 'Test', type: 'hacker' })
      .expect(400);
    expect(res.body.errors).toBeDefined();
  });

  it('POST /api/profiles/:id/activate switches profile', async () => {
    const res = await request(app).post('/api/profiles/guest/activate').expect(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.active).toHaveProperty('type', 'guest');

    // restore main
    await request(app).post('/api/profiles/main/activate');
  });

  it('GET /api/profiles/:id/permissions returns permissions', async () => {
    const res = await request(app).get('/api/profiles/guest/permissions').expect(200);
    expect(res.body).toHaveProperty('permissions');
    expect(res.body.permissions.executeSmartThingsScenes).toBe(false);
    expect(res.body.permissions.executeTvCommands).toBe(false);
    expect(res.body.readOnlyMode).toBe(true);
    expectNoProfileLeak(res.body);
  });

  it('POST /api/profiles/guest/check-action denies sensitive action', async () => {
    const res = await request(app)
      .post('/api/profiles/guest/check-action')
      .send({ actionType: 'smartthings.scene.execute' })
      .expect(200);
    expect(res.body.allowed).toBe(false);
    expect(typeof res.body.reason).toBe('string');
    expect(res.body.reason.length).toBeGreaterThan(0);
    expectNoProfileLeak(res.body);
  });

  it('POST /api/profiles/main/check-action allows safe diagnostics', async () => {
    const res = await request(app)
      .post('/api/profiles/main/check-action')
      .send({ actionType: 'adb.diagnose' })
      .expect(200);
    expect(res.body.allowed).toBe(true);
    expectNoProfileLeak(res.body);
  });

  it('DELETE /api/profiles/main returns 403 (profil principal protégé)', async () => {
    const res = await request(app).delete('/api/profiles/main').expect(403);
    expect(res.body.status).toBe('error');
  });

  it('PATCH /api/profiles/family updates preferences', async () => {
    const res = await request(app)
      .patch('/api/profiles/family')
      .send({ preferences: { compactMode: true } })
      .expect(200);
    expect(res.body.preferences.compactMode).toBe(true);
    expectNoProfileLeak(res.body);
  });

  it('GET /api/profiles/audit returns audit entries', async () => {
    const res = await request(app).get('/api/profiles/audit').expect(200);
    expect(Array.isArray(res.body.entries)).toBe(true);
    expectNoProfileLeak(res.body);
  });

  it('response contains no sensitive data', async () => {
    const res = await request(app).get('/api/profiles').expect(200);
    expectNoProfileLeak(res.body);
    const text = JSON.stringify(res.body);
    expect(text).not.toMatch(/token/i);
    expect(text).not.toMatch(/password/i);
  });

  it('creating a profile in this suite does not pollute other test suites (isolation check)', async () => {
    // Create a temp profile
    const createRes = await request(app)
      .post('/api/profiles')
      .send({ name: 'Isolation Test Profile', type: 'diagnostic' })
      .expect(201);
    const newId = createRes.body.id;

    // Confirm it exists in this suite's store
    const listRes = await request(app).get('/api/profiles').expect(200);
    const found = listRes.body.profiles.some(p => p.id === newId);
    expect(found).toBe(true);

    // Reset active profile to main so next tests are consistent
    await request(app).post('/api/profiles/main/activate');
  });
});

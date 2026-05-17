const request = require('supertest');
const { app } = require('../../server');
const { expectNoSensitiveLeak } = require('../helpers/sensitive');

const endpoints = [
  '/api/observability/overview',
  '/api/observability/health',
  '/api/observability/security',
  '/api/observability/runtime',
  '/api/observability/tests',
  '/api/observability/logs',
  '/api/observability/safety',
];

function expectNoObservabilityLeak(body) {
  const text = JSON.stringify(body);
  expectNoSensitiveLeak(body);
  expect(text).not.toMatch(/\bBearer\b/i);
  expect(text).not.toMatch(/token/i);
  expect(text).not.toMatch(/password/i);
  expect(text).not.toMatch(/runtimeContentRaw|fileContent|contents/i);
}

describe('observability API', () => {
  it.each(endpoints)('%s returns safe JSON', async (endpoint) => {
    const res = await request(app).get(endpoint).expect(200);

    expect(res.type).toMatch(/json/);
    expectNoObservabilityLeak(res.body);
  });

  it('returns the expected overview shape', async () => {
    const res = await request(app).get('/api/observability/overview').expect(200);

    expect(['ok', 'warning', 'error']).toContain(res.body.status);
    expect(res.body.phase).toBe(18);
    expect(res.body.backend).toEqual(expect.any(Object));
    expect(res.body.frontend).toEqual(expect.any(Object));
    expect(res.body.integrations).toEqual(expect.any(Object));
    expect(res.body.scheduler).toEqual(expect.any(Object));
    expect(res.body.notifications).toEqual(expect.any(Object));
    expect(res.body.security).toEqual(expect.any(Object));
    expect(res.body.runtime.contentHidden).toBe(true);
    expect(res.body.tests.apiRunsTests).toBe(false);
    expect(res.body.logs.contentHidden).toBe(true);
    expect(res.body.lastUpdatedAt).toEqual(expect.any(String));
  });

  it('returns strict safety flags', async () => {
    const res = await request(app).get('/api/observability/safety').expect(200);

    expect(res.body).toEqual({
      localOnly: true,
      secretsMasked: true,
      noCloudTelemetry: true,
      sensitiveActionsBlocked: true,
      apiCacheDisabled: true,
      runtimeContentHidden: true,
    });
  });
});

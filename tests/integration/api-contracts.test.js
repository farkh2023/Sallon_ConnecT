const request = require('supertest');
const { app } = require('../../server');
const { expectNoSensitiveLeak } = require('../helpers/sensitive');

const endpoints = [
  '/api/health',
  '/api/notifications/safety',
  '/api/scheduler/safety',
  '/api/adb/safety',
  '/api/dlna/safety',
  '/api/smartthings/safety',
  '/api/streaming/policy',
  '/api/observability/safety',
  '/api/observability/overview',
];

describe('API contracts', () => {
  it.each(endpoints)('%s returns JSON without sensitive runtime values', async (endpoint) => {
    const res = await request(app).get(endpoint).expect(200);
    expect(res.type).toMatch(/json/);
    expectNoSensitiveLeak(res.body);
  });
});

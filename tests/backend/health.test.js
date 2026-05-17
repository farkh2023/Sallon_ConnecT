const request = require('supertest');
const { app } = require('../../server');
const { expectNoSensitiveLeak } = require('../helpers/sensitive');

describe('GET /api/health', () => {
  it('returns ok health JSON without sensitive data', async () => {
    const res = await request(app).get('/api/health').expect(200);

    expect(res.type).toMatch(/json/);
    expect(res.body.status).toBe('ok');
    expect(Number(res.body.phase)).toBeGreaterThanOrEqual(3);
    expect(res.body.server).toMatch(/Sallon-ConnecT/);
    expect(res.body.timestamp).toEqual(expect.any(String));
    expectNoSensitiveLeak(res.body);
  });
});

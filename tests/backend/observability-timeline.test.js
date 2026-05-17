const request = require('supertest');
const { app } = require('../../server');
const { expectNoSensitiveLeak } = require('../helpers/sensitive');

function expectNoTimelineLeak(body) {
  const text = JSON.stringify(body);
  expectNoSensitiveLeak(body);
  expect(text).not.toMatch(/\bBearer\b/i);
  expect(text).not.toMatch(/\btoken\b/i);
  expect(text).not.toMatch(/runtimeContentRaw|fileContent/i);
  expect(text).not.toMatch(/logs bruts|raw logs/i);
  // No full paths
  expect(text).not.toMatch(/[A-Za-z]:\\[^\s"]{20,}/);
  expect(text).not.toMatch(/\/home\/[^\s"]{10,}/);
  expect(text).not.toMatch(/\/var\/[^\s"]{10,}/);
}

describe('observability timeline & export API', () => {
  beforeAll(async () => {
    // Ensure at least one snapshot exists
    await request(app).post('/api/observability/snapshots').expect(201);
  });

  describe('GET /api/observability/snapshots/timeline', () => {
    it('returns items and summary', async () => {
      const res = await request(app)
        .get('/api/observability/snapshots/timeline')
        .expect(200);

      expect(res.type).toMatch(/json/);
      expect(res.body).toHaveProperty('items');
      expect(res.body).toHaveProperty('summary');
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body.summary).toMatchObject({
        total: expect.any(Number),
        ok: expect.any(Number),
        warning: expect.any(Number),
        error: expect.any(Number),
      });
      expectNoTimelineLeak(res.body);
    });

    it('timeline items have expected score fields', async () => {
      const res = await request(app)
        .get('/api/observability/snapshots/timeline')
        .expect(200);

      if (res.body.items.length > 0) {
        const item = res.body.items[0];
        expect(item).toHaveProperty('createdAt');
        expect(item).toHaveProperty('source');
        expect(item).toHaveProperty('status');
        expect(item).toHaveProperty('statusScore');
        expect(item).toHaveProperty('memoryScore');
        expect(item).toHaveProperty('notificationScore');
        expect(item).toHaveProperty('securityScore');
        expect(item).toHaveProperty('integrationScore');
        expect(item).toHaveProperty('schedulerScore');
        expect(item).toHaveProperty('runtimeScore');
        expect(item.statusScore).toBeGreaterThanOrEqual(0);
        expect(item.statusScore).toBeLessThanOrEqual(1);
      }
    });

    it('respects limit filter', async () => {
      // Create a few more snapshots
      await request(app).post('/api/observability/snapshots');
      await request(app).post('/api/observability/snapshots');

      const res = await request(app)
        .get('/api/observability/snapshots/timeline?limit=2')
        .expect(200);

      expect(res.body.items.length).toBeLessThanOrEqual(2);
    });

    it('respects status filter', async () => {
      const res = await request(app)
        .get('/api/observability/snapshots/timeline?status=ok')
        .expect(200);

      for (const item of res.body.items) {
        expect(item.status).toBe('ok');
      }
    });

    it('respects source filter', async () => {
      const res = await request(app)
        .get('/api/observability/snapshots/timeline?source=manual')
        .expect(200);

      for (const item of res.body.items) {
        expect(item.source).toBe('manual');
      }
    });

    it('summary counts match items', async () => {
      const res = await request(app)
        .get('/api/observability/snapshots/timeline')
        .expect(200);

      const { items, summary } = res.body;
      const okCount = items.filter(i => i.status === 'ok').length;
      const warnCount = items.filter(i => i.status === 'warning').length;
      const errCount = items.filter(i => i.status === 'error').length;

      expect(summary.total).toBe(items.length);
      expect(summary.ok).toBe(okCount);
      expect(summary.warning).toBe(warnCount);
      expect(summary.error).toBe(errCount);
    });

    it('contains no sensitive data', async () => {
      const res = await request(app)
        .get('/api/observability/snapshots/timeline')
        .expect(200);

      expectNoTimelineLeak(res.body);
    });
  });

  describe('GET /api/observability/snapshots/export.json', () => {
    it('returns JSON attachment', async () => {
      const res = await request(app)
        .get('/api/observability/snapshots/export.json')
        .expect(200);

      expect(res.type).toMatch(/json/);
      expect(res.headers['content-disposition']).toMatch(/attachment/);
      expect(res.headers['content-disposition']).toMatch(/observability-snapshots\.json/);
      expect(Array.isArray(res.body)).toBe(true);
      expectNoTimelineLeak(res.body);
    });
  });

  describe('GET /api/observability/snapshots/export.csv', () => {
    it('returns CSV attachment with header row', async () => {
      const res = await request(app)
        .get('/api/observability/snapshots/export.csv')
        .expect(200);

      expect(res.type).toMatch(/text\/csv/);
      expect(res.headers['content-disposition']).toMatch(/attachment/);
      expect(res.headers['content-disposition']).toMatch(/observability-snapshots\.csv/);
      const lines = res.text.split('\n');
      expect(lines[0]).toBe(
        'createdAt,status,source,memoryBucket,notificationsBucket,schedulerRunning,portableZipPresent'
      );
    });

    it('CSV contains no sensitive data', async () => {
      const res = await request(app)
        .get('/api/observability/snapshots/export.csv')
        .expect(200);

      expect(res.text).not.toMatch(/\bBearer\b/i);
      expect(res.text).not.toMatch(/\btoken\b/i);
      expect(res.text).not.toMatch(/[A-Za-z]:\\[^\s,]{20,}/);
    });
  });
});

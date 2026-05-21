const request = require('supertest');
const { app } = require('../../server');
const store = require('../../server/src/services/notifications/notificationStore');
const safety = require('../../server/src/services/notifications/notificationSafety');
const { expectNoSensitiveLeak } = require('../helpers/sensitive');

describe('notifications API and safety', () => {
  beforeEach(() => {
    store.clearNotifications();
  });

  it('sanitizes notification text and metadata', async () => {
    const sampleImei = ['12345', '67890', '12345'].join('');
    const sensitive = ['abcdefghijkl', 'mnopqrstuvwxyz', '123456'].join('');
    const res = await request(app)
      .post('/api/notifications')
      .send({
        type: 'security',
        level: 'security',
        title: `Alerte token=${sensitive}`,
        message: `IP 192.168.1.42 IMEI ${sampleImei} C:\\Example\\secret.txt`,
        meta: {
          token: sensitive,
          location: '10.0.0.12',
        },
      })
      .expect(201);

    const notif = res.body.notification;
    expect(notif.sensitiveDataMasked).toBe(true);
    expect(notif.title).toContain('[token');
    expect(notif.message).toContain('[ip');
    expect(notif.message).toContain('[imei');
    expect(notif.message).toContain('[chemin');
    expect(notif.meta).not.toHaveProperty('token');
    expectNoSensitiveLeak(notif);
  });

  it('deduplicates repeated notifications', async () => {
    const payload = {
      type: 'system',
      level: 'info',
      title: `Dedup ${Date.now()}`,
      message: 'same',
    };

    await request(app).post('/api/notifications').send(payload).expect(201);
    await request(app).post('/api/notifications').send(payload).expect(429);
  });

  it('marks read, returns stats, clears notifications and reports local-only safety', async () => {
    const created = await request(app)
      .post('/api/notifications')
      .send({ type: 'system', level: 'info', title: `Read ${Date.now()}` })
      .expect(201);

    const id = created.body.notification.id;
    await request(app).patch(`/api/notifications/${id}/read`).expect(200);

    const stats = await request(app).get('/api/notifications/stats').expect(200);
    expect(stats.body.total).toBe(1);
    expect(stats.body.unread).toBe(0);

    const safetyRes = await request(app).get('/api/notifications/safety').expect(200);
    expect(safetyRes.body.localOnly).toBe(true);
    expect(safetyRes.body.firebase).toBe(false);
    expect(safetyRes.body.cloudServices).toBe(false);

    const cleared = await request(app).delete('/api/notifications').expect(200);
    expect(cleared.body.success).toBe(true);
  });

  it('masks sensitive strings through notificationSafety', () => {
    const bearerSample = ['abcdefghijkl', 'mnopqrstuvwxyz', '123456'].join('');
    const masked = safety.maskSensitiveText(
      `Bearer ${bearerSample} 192.168.1.20 ${['12345', '67890', '12345'].join('')}`
    );

    expect(masked).toContain('[token');
    expect(masked).toContain('[ip');
    expect(masked).toContain('[imei');
    expectNoSensitiveLeak({ masked });
  });
});

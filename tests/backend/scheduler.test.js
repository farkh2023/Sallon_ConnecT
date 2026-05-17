const request = require('supertest');
const { app } = require('../../server');
const actions = require('../../server/src/services/scheduler/schedulerActions');
const engine = require('../../server/src/services/scheduler/schedulerEngine');
const safety = require('../../server/src/services/scheduler/schedulerSafety');
const store = require('../../server/src/services/scheduler/schedulerStore');
const notifStore = require('../../server/src/services/notifications/notificationStore');

function manualSchedule(name, actionType = 'system.healthCheck') {
  return {
    name,
    actionType,
    enabled: true,
    schedule: { type: 'manual' },
  };
}

describe('scheduler safety and API', () => {
  beforeEach(() => {
    store.saveSchedules([]);
    store.clearHistory();
    notifStore.clearNotifications();
    jest.restoreAllMocks();
  });

  it('lists allowed and blocked actions', async () => {
    const res = await request(app).get('/api/scheduler/safety').expect(200);
    expect(res.body.allowedActions).toContain('system.healthCheck');
    expect(res.body.blockedActions).toContain('streaming.play');
    expect(res.body.localOnly).toBe(true);
    expect(res.body.cloudServices).toBe(false);
  });

  it('creates allowed schedules and rejects sensitive actions', async () => {
    const created = await request(app)
      .post('/api/scheduler/schedules')
      .send(manualSchedule('Health'))
      .expect(201);

    expect(created.body.schedule.actionType).toBe('system.healthCheck');

    const rejected = await request(app)
      .post('/api/scheduler/schedules')
      .send(manualSchedule('Bad', 'streaming.play'))
      .expect(400);
    expect(rejected.body.error).toMatch(/bloqu/);
  });

  it('runs system.healthCheck manually and writes history with notificationId', async () => {
    const schedule = store.createSchedule(manualSchedule('Manual health'));
    const res = await request(app).post(`/api/scheduler/schedules/${schedule.id}/run`).expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('success');

    const history = store.getHistory(5);
    expect(history).toHaveLength(1);
    expect(history[0].actionType).toBe('system.healthCheck');
    expect(history[0].notificationId).toEqual(expect.any(String));
  });

  it('prevents parallel execution of the same schedule', async () => {
    const schedule = store.createSchedule(manualSchedule('Slow health'));
    let release;
    jest.spyOn(actions, 'executeAction').mockImplementation(
      () => new Promise((resolve) => {
        release = () => resolve({ status: 'ok', message: 'done' });
      })
    );

    const first = engine.runSchedule(schedule.id);
    const second = await engine.runSchedule(schedule.id);
    release();
    await first;

    expect(second.success).toBe(false);
    expect(second.reason).toMatch(/cours/);
  });

  it('blocks unknown and sensitive actions in safety helper', () => {
    expect(safety.blockSensitiveAction('system.healthCheck').blocked).toBe(false);
    expect(safety.blockSensitiveAction('streaming.play').blocked).toBe(true);
    expect(safety.blockSensitiveAction('not.real').blocked).toBe(true);
  });
});

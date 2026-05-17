'use strict';

const store = require('./schedulerStore');

function seedDefaultSchedules() {
  try {
    const existing = store.listSchedules({ actionType: 'observability.snapshot' });
    if (existing.length > 0) return;
    store.createSchedule({
      name: 'Snapshot observabilite',
      description: 'Cree un snapshot d\'observabilite quotidien. Desactive par defaut.',
      actionType: 'observability.snapshot',
      enabled: false,
      schedule: { type: 'daily', time: '21:00' },
      source: 'seed',
    });
  } catch { /* Silencieux */ }
}

seedDefaultSchedules();

module.exports = { seedDefaultSchedules };

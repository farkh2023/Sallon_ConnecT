const fs = require('fs');
const path = require('path');

const runtimeDir = path.join(__dirname, '.runtime');
fs.mkdirSync(runtimeDir, { recursive: true });

process.env.NODE_ENV = 'test';
process.env.SCHEDULER_AUTO_START = 'false';
process.env.NOTIFICATIONS_STORE_PATH = path.join(runtimeDir, 'notifications.json');
process.env.SCHEDULER_STORE_PATH = path.join(runtimeDir, 'schedules.json');
process.env.SCHEDULER_HISTORY_PATH = path.join(runtimeDir, 'schedule-history.json');
process.env.SMARTTHINGS_ENABLED = 'false';
process.env.SMARTTHINGS_TOKEN = '';
process.env.SMARTTHINGS_ALLOW_SCENE_EXECUTION = 'false';
process.env.SMARTTHINGS_TV_COMMANDS_ENABLED = 'false';
process.env.MEDIA_STREAMING_ENABLED = 'false';
process.env.DLNA_ENABLED = 'false';
process.env.ADB_ENABLED = 'false';

for (const file of ['notifications.json', 'schedules.json', 'schedule-history.json']) {
  fs.writeFileSync(path.join(runtimeDir, file), '[]', 'utf8');
}

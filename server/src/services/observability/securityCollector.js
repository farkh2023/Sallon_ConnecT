'use strict';

const fs = require('fs');
const path = require('path');
const config = require('../config');
const schedulerSafety = require('../scheduler/schedulerSafety');
const { summarizeStatuses } = require('./sanitizer');

const ROOT = path.resolve(__dirname, '../../../..');

function readText(relativePath) {
  try {
    return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
  } catch {
    return '';
  }
}

function gitignoreHas(pattern) {
  const content = readText('.gitignore');
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .includes(pattern);
}

function check(id, label, ok, detail) {
  return {
    id,
    label,
    status: ok ? 'ok' : 'warning',
    ok: Boolean(ok),
    detail,
  };
}

function serviceWorkerAvoidsApiCache() {
  const sw = readText('frontend/public/sw.js');
  return (
    sw.includes('/api/') &&
    sw.includes("cache: 'no-store'") &&
    sw.includes('isSensitiveRequest')
  );
}

function collectSecurity() {
  const smartThingsSceneSafe =
    !config.smartThings.allowSceneExecution ||
    config.smartThings.sceneExecutionRequireConfirmation;
  const tvCommandsSafe =
    !config.smartThings.tvCommandsEnabled ||
    config.smartThings.tvCommandsRequireConfirmation;
  const schedulerBlocksSensitive =
    schedulerSafety.BLOCKED_ACTIONS.includes('streaming.play') &&
    schedulerSafety.BLOCKED_ACTIONS.includes('smartthings.scene.execute') &&
    schedulerSafety.BLOCKED_ACTIONS.includes('smartthings.tv.command') &&
    !config.scheduler.allowSensitiveActions;

  const checks = [
    check('gitignore-env', '.gitignore protects .env', gitignoreHas('.env')),
    check('gitignore-runtime-json', '.gitignore protects runtime JSON', gitignoreHas('runtime/*.json')),
    check('gitignore-frontend-env', '.gitignore protects frontend local env', gitignoreHas('frontend/.env.local')),
    check('service-worker-api-cache', 'Service worker bypasses API cache', serviceWorkerAvoidsApiCache()),
    check('smartthings-scenes-opt-in', 'SmartThings scenes stay opt-in', smartThingsSceneSafe),
    check('tv-commands-opt-in', 'TV commands stay opt-in', tvCommandsSafe),
    check('streaming-confirmation', 'Streaming requires confirmation', config.streaming.requireConfirmation),
    check('adb-read-only', 'ADB remains read only', config.adb.readOnly),
    check('dlna-read-only', 'DLNA remains read only', config.dlna.readOnly),
    check('scheduler-sensitive-block', 'Scheduler blocks sensitive actions', schedulerBlocksSensitive),
    check('gitignore-log-json', '.gitignore protects JSON logs', gitignoreHas('logs/*.json')),
  ];

  const status = summarizeStatuses(checks.map((item) => item.status));

  return {
    status,
    localOnly: true,
    secretsMasked: true,
    noCloudTelemetry: true,
    apiCacheDisabled: serviceWorkerAvoidsApiCache(),
    sensitiveActionsBlocked: schedulerBlocksSensitive,
    checks,
    summary: {
      total: checks.length,
      ok: checks.filter((item) => item.ok).length,
      warning: checks.filter((item) => item.status === 'warning').length,
    },
    lastUpdatedAt: new Date().toISOString(),
  };
}

module.exports = {
  collectSecurity,
};

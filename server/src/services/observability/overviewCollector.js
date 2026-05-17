'use strict';

const config = require('../config');
const notificationEngine = require('../notifications/notificationEngine');
const notificationStore = require('../notifications/notificationStore');
const schedulerStore = require('../scheduler/schedulerStore');
const schedulerSafety = require('../scheduler/schedulerSafety');
const { collectHealth } = require('./healthCollector');
const { collectSecurity } = require('./securityCollector');
const { collectRuntime } = require('./runtimeCollector');
const { collectTests } = require('./testCollector');
const { collectLogs } = require('./logCollector');
const { sanitizeForResponse, summarizeStatuses } = require('./sanitizer');

let lastObservedStatus = 'ok';

function collectSafety() {
  return {
    localOnly: true,
    secretsMasked: true,
    noCloudTelemetry: true,
    sensitiveActionsBlocked: true,
    apiCacheDisabled: true,
    runtimeContentHidden: true,
  };
}

function collectIntegrationsSummary() {
  return {
    status: 'ok',
    adb: {
      enabled: Boolean(config.adb.enabled),
      readOnly: Boolean(config.adb.readOnly),
    },
    dlna: {
      enabled: Boolean(config.dlna.enabled),
      readOnly: Boolean(config.dlna.readOnly),
    },
    smartThings: {
      enabled: Boolean(config.smartThings.enabled),
      readOnly: Boolean(config.smartThings.readOnly),
      scenesOptIn: !config.smartThings.allowSceneExecution,
      tvCommandsOptIn: !config.smartThings.tvCommandsEnabled,
      credentialsConfigured: Boolean(config.smartThings.token),
    },
    streaming: {
      enabled: Boolean(config.streaming.enabled),
      confirmationRequired: Boolean(config.streaming.requireConfirmation),
      pathsMasked: Boolean(config.streaming.maskPaths),
    },
  };
}

function collectSchedulerSummary() {
  const schedules = schedulerStore.listSchedules();
  const enabled = schedules.filter((item) => item.enabled);
  return {
    status: 'ok',
    enabled: Boolean(config.scheduler.enabled),
    totalSchedules: schedules.length,
    activeSchedules: enabled.length,
    allowedActions: schedulerSafety.ALLOWED_ACTIONS.length,
    blockedActions: schedulerSafety.BLOCKED_ACTIONS.length,
    snapshotAllowed: schedulerSafety.ALLOWED_ACTIONS.includes('observability.snapshot'),
    sensitiveActionsBlocked: schedulerSafety.BLOCKED_ACTIONS.includes('streaming.play'),
  };
}

function collectNotificationsSummary() {
  const stats = notificationStore.getNotificationStats();
  return {
    status: 'ok',
    enabled: Boolean(config.notifications.enabled),
    total: stats.total,
    unread: stats.unread,
    lastNotificationAt: stats.lastNotificationAt,
  };
}

function statusFromCollectors({ health, security, runtime, tests, logs }) {
  return summarizeStatuses([
    health.status,
    security.status,
    runtime.status,
    tests.status,
    logs.status,
  ]);
}

function notifyOnStatusChange(status) {
  if (status === lastObservedStatus) return null;
  lastObservedStatus = status;

  if (status !== 'warning' && status !== 'error') return null;

  return notificationEngine.notify({
    type: 'system',
    level: status,
    title: `Observability status ${status}`,
    message: `Global observability status changed to ${status}.`,
    meta: { phase: 18, status },
  });
}

function collectOverview(options = {}) {
  const health = collectHealth();
  const security = collectSecurity();
  const runtime = collectRuntime();
  const tests = collectTests();
  const logs = collectLogs();
  const status = statusFromCollectors({ health, security, runtime, tests, logs });

  if (options.notifyOnStatusChange) {
    notifyOnStatusChange(status);
  }

  const overview = {
    status,
    phase: 18,
    backend: health.backend,
    frontend: {
      ...health.frontend,
      apiCacheDisabled: security.apiCacheDisabled,
    },
    integrations: collectIntegrationsSummary(),
    scheduler: collectSchedulerSummary(),
    notifications: collectNotificationsSummary(),
    security: {
      status: security.status,
      summary: security.summary,
      localOnly: security.localOnly,
      secretsMasked: security.secretsMasked,
      sensitiveActionsBlocked: security.sensitiveActionsBlocked,
    },
    runtime: {
      status: runtime.status,
      runtimeJsonFiles: runtime.runtimeJsonFiles,
      directories: runtime.directories,
      latestPortableZip: runtime.latestPortableZip,
      contentHidden: runtime.contentHidden,
    },
    tests: {
      status: tests.status,
      scripts: tests.scripts,
      missingScripts: tests.missingScripts,
      missingFiles: tests.missingFiles,
      apiRunsTests: tests.apiRunsTests,
    },
    logs: {
      status: logs.status,
      count: logs.count,
      files: logs.files,
      contentHidden: logs.contentHidden,
    },
    safety: collectSafety(),
    lastUpdatedAt: new Date().toISOString(),
  };

  return sanitizeForResponse(overview);
}

function collectSnapshotSummary() {
  const overview = collectOverview({ notifyOnStatusChange: true });
  return {
    status: overview.status,
    phase: overview.phase,
    message: `Observability snapshot: ${overview.status}`,
    summary: {
      security: overview.security.status,
      runtime: overview.runtime.status,
      tests: overview.tests.status,
      logs: overview.logs.status,
    },
    lastUpdatedAt: overview.lastUpdatedAt,
  };
}

module.exports = {
  collectOverview,
  collectSafety,
  collectSnapshotSummary,
};

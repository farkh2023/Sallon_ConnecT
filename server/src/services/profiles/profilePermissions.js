'use strict';

const DEFAULT_PERMISSIONS = {
  owner: {
    viewDevices: true,
    viewMedia: true,
    viewNotifications: true,
    viewScheduler: true,
    viewObservability: true,
    runSafeDiagnostics: true,
    runSchedulerManual: true,
    manageProfiles: true,
    executeSmartThingsScenes: false,
    executeTvCommands: false,
    startStreaming: false,
    clearAudits: true,
  },
  family: {
    viewDevices: true,
    viewMedia: true,
    viewNotifications: true,
    viewScheduler: false,
    viewObservability: false,
    runSafeDiagnostics: false,
    runSchedulerManual: false,
    manageProfiles: false,
    executeSmartThingsScenes: false,
    executeTvCommands: false,
    startStreaming: false,
    clearAudits: false,
  },
  guest: {
    viewDevices: false,
    viewMedia: true,
    viewNotifications: false,
    viewScheduler: false,
    viewObservability: false,
    runSafeDiagnostics: false,
    runSchedulerManual: false,
    manageProfiles: false,
    executeSmartThingsScenes: false,
    executeTvCommands: false,
    startStreaming: false,
    clearAudits: false,
  },
  tv: {
    viewDevices: false,
    viewMedia: true,
    viewNotifications: true,
    viewScheduler: false,
    viewObservability: false,
    runSafeDiagnostics: false,
    runSchedulerManual: false,
    manageProfiles: false,
    executeSmartThingsScenes: false,
    executeTvCommands: false,
    startStreaming: false,
    clearAudits: false,
  },
  diagnostic: {
    viewDevices: true,
    viewMedia: false,
    viewNotifications: true,
    viewScheduler: true,
    viewObservability: true,
    runSafeDiagnostics: true,
    runSchedulerManual: true,
    manageProfiles: false,
    executeSmartThingsScenes: false,
    executeTvCommands: false,
    startStreaming: false,
    clearAudits: false,
  },
};

const SENSITIVE_ACTIONS = new Set([
  'smartthings.scene.execute',
  'smartthings.tv.command',
  'streaming.play',
  'scheduler.run',
  'profiles.clear_audit',
  'profiles.manage',
  'observability.snapshot',
]);

const ACTION_PERMISSION_MAP = {
  'smartthings.scene.execute': 'executeSmartThingsScenes',
  'smartthings.tv.command': 'executeTvCommands',
  'streaming.play': 'startStreaming',
  'scheduler.run': 'runSchedulerManual',
  'profiles.manage': 'manageProfiles',
  'profiles.clear_audit': 'clearAudits',
  'observability.snapshot': 'runSafeDiagnostics',
  'adb.diagnose': 'runSafeDiagnostics',
  'dlna.discover': 'viewMedia',
};

function getDefaultPermissions(profileType) {
  return { ...(DEFAULT_PERMISSIONS[profileType] || DEFAULT_PERMISSIONS.guest) };
}

function canViewSection(profile, section) {
  if (!profile) return false;
  const prefs = profile.preferences || {};
  if (Array.isArray(prefs.visibleSections) && !prefs.visibleSections.includes(section)) return false;
  const perms = profile.permissions || {};
  const sectionPermMap = {
    devices: 'viewDevices',
    media: 'viewMedia',
    notifications: 'viewNotifications',
    scheduler: 'viewScheduler',
    observability: 'viewObservability',
    dashboard: null,
    scenarios: 'viewMedia',
  };
  const permKey = sectionPermMap[section];
  if (permKey && perms[permKey] === false) return false;
  return true;
}

function canRunAction(profile, actionType) {
  if (!profile) return false;
  const perms = profile.permissions || {};
  const safety = profile.safety || {};
  if (safety.readOnlyMode && actionType !== 'view') return false;
  const permKey = ACTION_PERMISSION_MAP[actionType];
  if (permKey && perms[permKey] === false) return false;
  return true;
}

function canUseSensitiveAction(profile, actionType) {
  if (!profile) return false;
  if (!canRunAction(profile, actionType)) return false;
  if (SENSITIVE_ACTIONS.has(actionType)) {
    const permKey = ACTION_PERMISSION_MAP[actionType];
    if (permKey) {
      const perms = profile.permissions || {};
      return perms[permKey] === true;
    }
    return false;
  }
  return true;
}

function mergePermissions(base, override) {
  if (!override || typeof override !== 'object') return { ...base };
  return { ...base, ...override };
}

function explainPermissionDecision(profile, actionType) {
  if (!profile) return { allowed: false, reason: 'Aucun profil actif.' };
  const safety = profile.safety || {};
  if (safety.readOnlyMode) {
    return { allowed: false, reason: 'Le profil est en mode lecture seule.' };
  }
  const permKey = ACTION_PERMISSION_MAP[actionType];
  const perms = profile.permissions || {};
  if (permKey && perms[permKey] === false) {
    return { allowed: false, reason: `Action interdite pour le profil "${profile.name}" (${profile.type}).` };
  }
  if (SENSITIVE_ACTIONS.has(actionType) && permKey && !perms[permKey]) {
    return { allowed: false, reason: 'Action sensible non autorisée pour ce profil.' };
  }
  return { allowed: true, reason: 'Action autorisée par le profil.' };
}

module.exports = {
  getDefaultPermissions,
  canViewSection,
  canRunAction,
  canUseSensitiveAction,
  mergePermissions,
  explainPermissionDecision,
  SENSITIVE_ACTIONS,
  DEFAULT_PERMISSIONS,
};

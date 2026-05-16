'use strict';
/* =============================================
   Sallon-ConnecT — config.js (Phase 5)
   Lecture centralisée des variables d'environnement
============================================= */

module.exports = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '127.0.0.1',

  network: {
    scanEnabled: process.env.NETWORK_SCAN_ENABLED === 'true',
  },

  media: {
    localGallery: {
      enabled: process.env.MEDIA_LOCAL_GALLERY_ENABLED === 'true',
      path:    process.env.MEDIA_LOCAL_GALLERY_PATH  || '',
    },
    youtube: {
      embedEnabled: process.env.YOUTUBE_EMBED_ENABLED !== 'false',
    },
  },

  adb: {
    enabled:        process.env.ADB_ENABLED         === 'true',
    path:           process.env.ADB_PATH            || '',
    deviceId:       process.env.ADB_DEVICE_ID       || '',
    readOnly:       process.env.ADB_READ_ONLY       !== 'false',
    commandTimeout: parseInt(process.env.ADB_COMMAND_TIMEOUT_MS || '5000', 10),
    maskDeviceId:   process.env.ADB_MASK_DEVICE_ID  !== 'false',
  },

  dlna: {
    enabled:                   process.env.DLNA_ENABLED                    === 'true',
    discoveryTimeout:          parseInt(process.env.DLNA_DISCOVERY_TIMEOUT_MS || '3000', 10),
    multicastAddress:          process.env.DLNA_MULTICAST_ADDRESS           || '239.255.255.250',
    multicastPort:             parseInt(process.env.DLNA_MULTICAST_PORT || '1900', 10),
    readOnly:                  process.env.DLNA_READ_ONLY                  !== 'false',
    maxResponses:              parseInt(process.env.DLNA_MAX_RESPONSES || '30', 10),
    fetchDescriptions:         process.env.DLNA_FETCH_DESCRIPTIONS          === 'true',
    maskLocalIps:              process.env.DLNA_MASK_LOCAL_IPS             !== 'false',
    /* Phase 11 — Streaming assisté */
    streamingEnabled:          process.env.DLNA_STREAMING_ENABLED           === 'true',
    rendererAllowlist:         process.env.DLNA_RENDERER_ALLOWLIST          || '',
    streamingTimeout:          parseInt(process.env.DLNA_STREAMING_TIMEOUT_MS || '5000', 10),
    blockAutoplayInScenarios:  process.env.DLNA_BLOCK_AUTOPLAY_IN_SCENARIOS !== 'false',
  },

  streaming: {
    enabled:             process.env.MEDIA_STREAMING_ENABLED              === 'true',
    requireConfirmation: process.env.MEDIA_STREAMING_REQUIRE_CONFIRMATION !== 'false',
    confirmationCode:    process.env.MEDIA_STREAMING_CONFIRMATION_CODE    || 'CONFIRMER_STREAM',
    allowedDir:          process.env.MEDIA_STREAMING_ALLOWED_DIR          || '',
    allowedExtensions:   process.env.MEDIA_STREAMING_ALLOWED_EXTENSIONS   || '.mp4,.mkv,.mp3,.jpg,.jpeg,.png',
    maxFileMb:           parseInt(process.env.MEDIA_STREAMING_MAX_FILE_MB || '500', 10),
    maskPaths:           process.env.MEDIA_STREAMING_MASK_PATHS           !== 'false',
    auditEnabled:        process.env.MEDIA_STREAMING_AUDIT_ENABLED        !== 'false',
    auditPath:           process.env.MEDIA_STREAMING_AUDIT_PATH           || 'runtime/media-streaming-audit.json',
  },

  smartThings: {
    enabled:                          process.env.SMARTTHINGS_ENABLED                          === 'true',
    token:                            process.env.SMARTTHINGS_TOKEN                            || '',
    readOnly:                         process.env.SMARTTHINGS_READ_ONLY                        !== 'false',
    apiBaseUrl:                       process.env.SMARTTHINGS_API_BASE_URL                     || 'https://api.smartthings.com/v1',
    tvDeviceId:                       process.env.SMARTTHINGS_TV_DEVICE_ID                     || '',
    defaultLocationId:                process.env.SMARTTHINGS_DEFAULT_LOCATION_ID              || '',
    commandTimeout:                   parseInt(process.env.SMARTTHINGS_COMMAND_TIMEOUT_MS     || '5000', 10),
    maskIds:                          process.env.SMARTTHINGS_MASK_IDS                        !== 'false',
    allowSceneExecution:              process.env.SMARTTHINGS_ALLOW_SCENE_EXECUTION            === 'true',
    sceneExecutionRequireConfirmation:process.env.SMARTTHINGS_SCENE_EXECUTION_REQUIRE_CONFIRMATION !== 'false',
    sceneExecutionConfirmationCode:   process.env.SMARTTHINGS_SCENE_EXECUTION_CONFIRMATION_CODE || 'CONFIRMER',
    sceneAllowlist:                   process.env.SMARTTHINGS_SCENE_ALLOWLIST                  || '',
    sceneAuditEnabled:                process.env.SMARTTHINGS_SCENE_AUDIT_ENABLED              !== 'false',
    sceneAuditPath:                   process.env.SMARTTHINGS_SCENE_AUDIT_PATH                 || 'runtime/smartthings-scene-audit.json',
    blockDeviceCommands:              process.env.SMARTTHINGS_BLOCK_DEVICE_COMMANDS            !== 'false',
    blockSensitiveDevices:            process.env.SMARTTHINGS_BLOCK_SENSITIVE_DEVICES          !== 'false',
    /* Phase 10 — Commandes TV contrôlées */
    tvCommandsEnabled:                process.env.SMARTTHINGS_TV_COMMANDS_ENABLED              === 'true',
    tvCommandsRequireConfirmation:    process.env.SMARTTHINGS_TV_COMMANDS_REQUIRE_CONFIRMATION !== 'false',
    tvConfirmationCode:               process.env.SMARTTHINGS_TV_CONFIRMATION_CODE             || 'CONFIRMER_TV',
    tvDeviceAllowlist:                process.env.SMARTTHINGS_TV_DEVICE_ALLOWLIST              || '',
    tvCommandAllowlist:               process.env.SMARTTHINGS_TV_COMMAND_ALLOWLIST             || 'switch.on,switch.off,mediaPlayback.play,mediaPlayback.pause,mediaPlayback.stop',
    tvAuditEnabled:                   process.env.SMARTTHINGS_TV_AUDIT_ENABLED                !== 'false',
    tvAuditPath:                      process.env.SMARTTHINGS_TV_AUDIT_PATH                   || 'runtime/smartthings-tv-audit.json',
    tvBlockVolumeCommands:            process.env.SMARTTHINGS_TV_BLOCK_VOLUME_COMMANDS        !== 'false',
    tvBlockKeypadInput:               process.env.SMARTTHINGS_TV_BLOCK_KEYPAD_INPUT           !== 'false',
    tvBlockSourceChange:              process.env.SMARTTHINGS_TV_BLOCK_SOURCE_CHANGE          !== 'false',
  },

  scenario: {
    liveEnabled:    process.env.SCENARIO_LIVE_ENABLED    === 'true',
    historyEnabled: process.env.SCENARIO_HISTORY_ENABLED !== 'false',
  },

  scheduler: {
    enabled:             process.env.SCHEDULER_ENABLED              !== 'false',
    tickMs:              parseInt(process.env.SCHEDULER_TICK_MS     || '30000', 10),
    storePath:           process.env.SCHEDULER_STORE_PATH           || 'runtime/schedules.json',
    historyPath:         process.env.SCHEDULER_HISTORY_PATH         || 'runtime/schedule-history.json',
    maxHistory:          parseInt(process.env.SCHEDULER_MAX_HISTORY || '200', 10),
    notifyOnSuccess:     process.env.SCHEDULER_NOTIFY_ON_SUCCESS    !== 'false',
    notifyOnFailure:     process.env.SCHEDULER_NOTIFY_ON_FAILURE    !== 'false',
    allowSensitiveActions: process.env.SCHEDULER_ALLOW_SENSITIVE_ACTIONS === 'true',
    defaultTimezone:     process.env.SCHEDULER_DEFAULT_TIMEZONE     || 'Europe/Paris',
    autoStart:           process.env.SCHEDULER_AUTO_START           !== 'false',
  },

  notifications: {
    enabled:            process.env.NOTIFICATIONS_ENABLED              !== 'false',
    browserEnabled:     process.env.NOTIFICATIONS_BROWSER_ENABLED      === 'true',
    auditEnabled:       process.env.NOTIFICATIONS_AUDIT_ENABLED        !== 'false',
    storePath:          process.env.NOTIFICATIONS_STORE_PATH           || 'runtime/notifications.json',
    maxItems:           parseInt(process.env.NOTIFICATIONS_MAX_ITEMS   || '200', 10),
    maskSensitiveData:  process.env.NOTIFICATIONS_MASK_SENSITIVE_DATA  !== 'false',
    defaultLevel:       process.env.NOTIFICATIONS_DEFAULT_LEVEL        || 'info',
    dedupWindowMs:      parseInt(process.env.NOTIFICATIONS_DEDUP_WINDOW_MS || '30000', 10),
    autoCleanupDays:    parseInt(process.env.NOTIFICATIONS_AUTO_CLEANUP_DAYS || '30', 10),
  },
};

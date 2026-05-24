export type SafetyLevel = 'safe' | 'restricted' | 'blocked';

export interface ApiResult<T = unknown> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export interface Device {
  id: string;
  name: string;
  type: string;
  status: string;
  statusLabel?: string;
  liveStatus?: 'online' | 'offline' | 'unconfigured';
  liveStatusLabel?: string;
  icon?: string;
}

export interface Agent {
  step: number;
  id: string;
  name: string;
  role: string;
  status: string;
}

export interface MediaService {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  status: string;
  url?: string;
}

export interface Scenario {
  id: string;
  name: string;
  description?: string;
  mode: string;
  status?: string;
  deviceCount?: number;
  stepCount?: number;
}

export interface NotificationItem {
  id: string;
  type: string;
  level: 'info' | 'success' | 'warning' | 'error' | 'security';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  meta?: Record<string, unknown>;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
  byLevel: Record<string, number>;
  lastNotificationAt: string | null;
}

export interface Schedule {
  id: string;
  name: string;
  description?: string;
  actionType: string;
  enabled: boolean;
  schedule: {
    type: 'interval' | 'daily' | 'weekly' | 'manual';
    intervalMinutes?: number;
    time?: string;
    daysOfWeek?: number[];
  };
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
  updatedAt: string;
  source?: string;
}

export interface SchedulerStatus {
  status: string;
  enabled: boolean;
  startedAt: string | null;
  tickMs: number;
  tickCount: number;
  autoStart: boolean;
  totalSchedules: number;
  activeSchedules: number;
  inFlight: number;
  nextScheduled: { name: string; at: string } | null;
}

export interface ScheduleHistoryItem {
  id: string;
  scheduleId: string;
  scheduleName: string;
  actionType: string;
  startedAt: string;
  finishedAt: string;
  status: 'success' | 'failed' | 'skipped' | 'blocked';
  durationMs: number;
  message: string;
  safe: boolean;
}

export interface AdbStatus {
  enabled: boolean;
  readOnly: boolean;
  status: string;
  deviceConnected?: boolean;
  deviceId?: string;
}

export interface DlnaStatus {
  enabled: boolean;
  readOnly: boolean;
  status: string;
  discoveryCount?: number;
}

export interface DlnaDevice {
  id: string;
  name: string;
  type?: string;
  location?: string;
}

export interface SmartThingsStatus {
  enabled: boolean;
  readOnly: boolean;
  status: string;
  tokenConfigured?: boolean;
  tvDeviceConfigured?: boolean;
}

export interface StreamingPolicy {
  enabled: boolean;
  requireConfirmation: boolean;
  allowedExtensions: string;
  maxFileMb: number;
  maskPaths: boolean;
  auditEnabled: boolean;
  dlnaStreamingEnabled: boolean;
  rendererAllowlistConfigured: boolean;
}

export type PwaInstallState = 'unsupported' | 'available' | 'prompting' | 'installed' | 'dismissed';

export type BackendHealthStatus = 'checking' | 'unknown' | 'online' | 'offline' | 'degraded';

export interface OfflineStatus {
  online: boolean;
  backendAvailable: boolean | null;
  backendStatus: BackendHealthStatus;
  lastCheckedAt: string | null;
  message: string | null;
}

export interface TvModeState {
  enabled: boolean;
  fullscreen: boolean;
  activePanel: 'dashboard' | 'notifications' | 'scheduler' | 'media' | 'observability' | null;
  lastRefreshAt: string | null;
}

export interface TvQuickAction {
  id: string;
  label: string;
  description?: string;
  shortcut?: string;
  safe: boolean;
  disabled?: boolean;
  onRun: () => void;
}

export type ObservabilityStatus = 'ok' | 'warning' | 'error';

export type SnapshotSource = 'manual' | 'scheduler' | 'startup';

export interface ObservabilitySnapshot {
  id?: string;
  createdAt: string;
  source: SnapshotSource;
  status: ObservabilityStatus;
  phase: number;
  backend: {
    ok: boolean;
    uptimeBucket: 'short' | 'medium' | 'long';
    memoryBucket: 'low' | 'medium' | 'high';
  };
  frontend: {
    expectedPort: number;
    configured: boolean;
  };
  integrations: {
    adb: 'disabled' | 'available' | 'warning' | 'error';
    dlna: 'disabled' | 'available' | 'warning' | 'error';
    smartThings: 'disabled' | 'available' | 'warning' | 'error';
    streaming: 'disabled' | 'available' | 'warning' | 'error';
  };
  scheduler: {
    running: boolean;
    activeSchedules: number;
  };
  notifications: {
    totalBucket: 'none' | 'low' | 'medium' | 'high';
    unreadBucket: 'none' | 'low' | 'medium' | 'high';
    securityEventsBucket: 'none' | 'low' | 'medium' | 'high';
  };
  security: {
    secretsProtected: boolean;
    runtimeHidden: boolean;
    apiCacheDisabled: boolean;
    sensitiveActionsBlocked: boolean;
  };
  runtime: {
    runtimeFilesBucket: 'none' | 'low' | 'medium' | 'high';
    logsBucket: 'none' | 'low' | 'medium' | 'high';
    portableZipPresent: boolean;
  };
}

export interface SnapshotStats {
  total: number;
  okCount: number;
  warningCount: number;
  errorCount: number;
  lastStatus: ObservabilityStatus | null;
  lastCreatedAt: string | null;
  statusChanges: number;
  mostCommonStatus: string | null;
}

export interface SnapshotTrends {
  statusTrend: 'stable' | 'improving' | 'degrading';
  warningFrequency: number;
  errorFrequency: number;
  memoryTrend: 'stable' | 'increasing' | 'decreasing';
  notificationTrend: 'stable' | 'increasing' | 'decreasing';
  schedulerTrend: 'stable' | 'intermittent';
  integrationTrend: 'stable' | 'improving' | 'degrading';
}

export interface SnapshotTimelineItem {
  id?: string;
  createdAt: string;
  source: SnapshotSource;
  status: ObservabilityStatus;
  statusScore: number;
  memoryScore: number;
  notificationScore: number;
  securityScore: number;
  integrationScore: number;
  schedulerScore: number;
  runtimeScore: number;
}

export interface SnapshotTimelineSummary {
  total: number;
  ok: number;
  warning: number;
  error: number;
}

export interface SnapshotTimelineResponse {
  items: SnapshotTimelineItem[];
  summary: SnapshotTimelineSummary;
}

export interface SnapshotChartFilters {
  limit?: number;
  status?: 'ok' | 'warning' | 'error' | '';
  source?: 'manual' | 'scheduler' | 'startup' | '';
  from?: string;
  to?: string;
}

export interface ObservabilityDirectorySummary {
  name: string;
  exists: boolean;
  fileCount: number;
  jsonFileCount: number;
  gitkeepPresent: boolean;
  totalSize: string;
}

export interface ObservabilityPortableZip {
  present: boolean;
  name: string | null;
  size: string | null;
  modifiedAt: string | null;
}

export interface ObservabilityOverview {
  status: ObservabilityStatus;
  phase: number;
  backend: {
    status: string;
    uptimeSeconds: number;
    nodeVersion: string;
    memoryUsed: string;
    memoryTotal: string;
    port: number;
    apiHealthAvailable: boolean;
    localOnly: boolean;
  };
  frontend: {
    status: string;
    expectedHost: string;
    expectedPort: number;
    expectedUrl: string;
    apiCacheDisabled: boolean;
  };
  integrations: Record<string, unknown>;
  scheduler: {
    status: string;
    enabled: boolean;
    totalSchedules: number;
    activeSchedules: number;
    allowedActions: number;
    blockedActions: number;
    snapshotAllowed: boolean;
    sensitiveActionsBlocked: boolean;
  };
  notifications: {
    status: string;
    enabled: boolean;
    total: number;
    unread: number;
    lastNotificationAt: string | null;
  };
  security: {
    status: ObservabilityStatus;
    summary: {
      total: number;
      ok: number;
      warning: number;
    };
    localOnly: boolean;
    secretsMasked: boolean;
    sensitiveActionsBlocked: boolean;
  };
  runtime: {
    status: ObservabilityStatus;
    runtimeJsonFiles: number;
    directories: Record<string, ObservabilityDirectorySummary>;
    latestPortableZip: ObservabilityPortableZip;
    contentHidden: boolean;
  };
  tests: {
    status: ObservabilityStatus;
    scripts: Record<string, boolean>;
    missingScripts: string[];
    missingFiles: string[];
    apiRunsTests: boolean;
  };
  logs: {
    status: ObservabilityStatus;
    count: number;
    files: Array<{
      name: string;
      size: string;
      modifiedAt: string;
    }>;
    contentHidden: boolean;
  };
  safety: {
    localOnly: boolean;
    secretsMasked: boolean;
    noCloudTelemetry: boolean;
    sensitiveActionsBlocked: boolean;
    apiCacheDisabled: boolean;
    runtimeContentHidden: boolean;
  };
  lastUpdatedAt: string;
}

/* ── Phase 20 — Profils utilisateurs locaux ─────────────────────── */

export type ProfileType = 'owner' | 'family' | 'guest' | 'tv' | 'diagnostic';

export interface ProfilePreferences {
  theme: 'dark' | 'light' | 'system';
  accentColor: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'slate';
  defaultView: 'dashboard' | 'media' | 'notifications' | 'observability';
  tvModeDefault: boolean;
  compactMode: boolean;
  language: 'fr' | 'en';
  refreshIntervalSeconds: number;
  visibleSections: string[];
}

export interface ProfilePermissions {
  viewDevices: boolean;
  viewMedia: boolean;
  viewNotifications: boolean;
  viewScheduler: boolean;
  viewObservability: boolean;
  runSafeDiagnostics: boolean;
  runSchedulerManual: boolean;
  manageProfiles: boolean;
  executeSmartThingsScenes: boolean;
  executeTvCommands: boolean;
  startStreaming: boolean;
  clearAudits: boolean;
  viewBackups: boolean;
  createBackups: boolean;
  restoreBackups: boolean;
  deleteBackups: boolean;
  viewBackupAudit: boolean;
}

export interface ProfileSafety {
  sensitiveActionsRequireConfirmation: boolean;
  hideSensitivePanels: boolean;
  readOnlyMode: boolean;
}

export interface UserProfile {
  id?: string;
  name: string;
  type: ProfileType;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  preferences: ProfilePreferences;
  permissions: ProfilePermissions;
  safety: ProfileSafety;
}

export interface ProfileAuditEntry {
  at: string;
  event: string;
  profileId?: string;
  profileName?: string;
  profileType?: string;
}

export interface ProfileActionCheckResult {
  allowed: boolean;
  reason: string;
}

// ── Phase 21 — Backup types ──────────────────────────────────────

export interface BackupStatus {
  enabled: boolean;
  backupDirMasked: string;
  maxItems: number;
  rollbackEnabled: boolean;
  dryRunRequired: boolean;
  confirmationRequired: boolean;
  count: number;
  latest: { backupId: string; createdAt: string } | null;
}

export interface BackupItem {
  backupId: string;
  fileName: string;
  filePath: string;
  createdAt: string;
  summary: {
    fileCount: number;
    totalSizeBucket: string;
    runtimeIncluded: boolean;
    auditsIncluded: boolean;
    logsIncluded: boolean;
  } | null;
  checksumPresent: boolean;
}

export interface BackupManifest {
  backupId?: string;
  createdAt?: string;
  project?: string;
  phase?: number;
  mode?: string;
  profile?: string;
  options?: { includeRuntimeSafe: boolean; includeAudits: boolean; includeLogs: boolean };
  summary?: { fileCount: number; totalSizeBucket: string; runtimeIncluded: boolean; auditsIncluded: boolean; logsIncluded: boolean };
  files?: { path?: string; sizeBucket?: string; checksum?: string }[];
  security?: Record<string, boolean>;
  backupChecksum?: string;
}

export interface BackupAuditEntry {
  at: string;
  event: string;
  backupId?: string;
  status?: string;
  reason?: string;
  fileCount?: number;
  sizeBucket?: string;
}

export interface BackupDryRunResult {
  backupId: string;
  dryRun: true;
  willRestore: string[];
  conflicts: string[];
  newFiles: string[];
  modified: string[];
  risks: string[];
  confirmationRequired: boolean;
  rollbackWillBeCreated: boolean;
  manifest?: BackupManifest;
  error?: string;
}

export interface BackupSafety {
  localOnly: boolean;
  cloudSync: boolean;
  envExcluded: boolean;
  secretsExcluded: boolean;
  rollbackEnabled: boolean;
  dryRunRequired: boolean;
  forbiddenPaths: string[];
}

// Phase 41 — Tableau de bord visuel des sauvegardes

export type BackupStatus41 = 'valid' | 'corrupted' | 'incomplete' | 'unknown';
export type BackupType41   = 'quick' | 'full' | 'unknown';

export interface BackupDashboardItem {
  id:          string;
  timestamp:   string | null;
  type:        BackupType41;
  description: string;
  fileCount:   number;
  totalSizeKB: number;
  valid:       boolean;
  hasChecksum: boolean;
  hasReport:   boolean;
}

export interface BackupDashboardSummary {
  total:          number;
  valid:          number;
  corrupted:      number;
  incomplete:     number;
  quick:          number;
  full:           number;
  totalSizeLabel: string;
  lastBackupAt:   string | null;
}

export interface BackupDashboardResponse {
  status:     'ok' | 'error';
  phase:      number;
  summary:    BackupDashboardSummary;
  items:      BackupDashboardItem[];
  diagnostic: { snapshotsDirExists: boolean; scriptsAvailable: boolean };
  safety:     BackupDashboardSafety;
}

export interface BackupDashboardSafety {
  localOnly:                        boolean;
  noCloud:                          boolean;
  restoreRequiresManualConfirmation: boolean;
  deleteRequiresConfirmation:       boolean;
  secretsExcluded:                  boolean;
  envExcluded:                      boolean;
  nodeModulesExcluded:              boolean;
  pathsMasked:                      boolean;
}

export interface BackupCreateRequest {
  type:      BackupType41;
  exportZip: boolean;
}

export interface BackupActionResult {
  ok:        boolean;
  type?:     string;
  exportZip?: boolean;
  error?:    string;
}

export interface BackupVerifyResult {
  ok:      boolean;
  results: { snapshotId: string; status: string; verified: string[]; missing: string[]; corrupted: string[] }[];
  error?:  string;
}

export interface BackupRestorePrepareResult {
  ok:          boolean;
  snapshotId:  string;
  warning:     string;
  instruction: string;
  command:     string;
  risks:       string[];
  localOnly:   boolean;
  noAutoRestore: boolean;
  error?:      string;
}

// Phase 42 — Assistant de restauration securise

export type RestoreRiskLevel = 'low' | 'medium' | 'high' | 'blocked';
export type RestoreAssistantStep = 'snapshot' | 'integrity' | 'dryrun' | 'risk' | 'checklist' | 'command';

export interface RestoreChecklistItem {
  id:      string;
  label:   string;
  checked?: boolean;
}

export interface RestoreRiskResult {
  level:           RestoreRiskLevel;
  score:           number;
  reasons:         string[];
  blockingReasons: string[];
}

export interface RestoreDryRunResult {
  status:          'ok' | 'blocked';
  snapshotId:      string;
  wouldRestore:    string[];
  wouldReplace:    string[];
  wouldKeep:       string[];
  excluded:        string[];
  preRestoreBackup: { willBeCreated: boolean; type: string };
  warnings:        string[];
  blockedReasons:  string[];
}

export interface RestoreManualCommand {
  manualOnly: boolean;
  command:    string | null;
  note:       string;
  safety:     Record<string, unknown>;
}

export interface RestoreAssistantSafety {
  manualOnly:         boolean;
  noAutoRestore:      boolean;
  noApiExecution:     boolean;
  requiresPowerShell: boolean;
  message:            string;
}

export interface RestoreAssistantResponse {
  snapshotId:    string;
  status:        'ready' | 'blocked';
  snapshot:      Record<string, unknown> | null;
  integrity:     { ok: boolean; results: { snapshotId: string; status: string; verified: string[]; missing: string[]; corrupted: string[] }[] } | null;
  dryRun:        RestoreDryRunResult | null;
  risk:          RestoreRiskResult;
  checklist:     RestoreChecklistItem[];
  manualCommand: string | null;
  safety:        RestoreAssistantSafety;
}

// Phase 43 — Plugins locaux extensibles

export interface PluginInfo {
  id:          string;
  name:        string;
  version:     string;
  description: string;
  author:      string;
  permissions: string[];
  localOnly:   boolean;
  enabled:     boolean;
  valid:       boolean;
  error:       string | null;
}

export interface PluginsListResponse {
  plugins: PluginInfo[];
  total:   number;
}

export interface PluginSafety {
  localOnly:              boolean;
  noNetworkByDefault:     boolean;
  noAutoInstall:          boolean;
  noCloudSync:            boolean;
  permissionsAllowlist:   string[];
  errorIsolation:         boolean;
  manualApprovalRequired: boolean;
}

// Phase 27 — Centre d'aide intégré

export interface HelpTopic {
  id: string;
  title: string;
  description: string;
  category: HelpCategory;
  tags: string[];
}

export interface HelpCommand {
  id: string;
  label: string;
  command: string;
  category: HelpCategory;
  description?: string;
}

export interface HelpLab {
  id: number;
  title: string;
  objective: string;
  command: string;
  expected: string;
  category: HelpCategory;
  level: 'debutant' | 'avance' | 'securite' | 'reseau';
}

export interface HelpFaqItem {
  id: string;
  question: string;
  answer: string;
  tags: string[];
}

export interface HelpTroubleshootingItem {
  id: string;
  problem: string;
  solution: string;
  command?: string;
  tags: string[];
}

export type HelpCategory =
  | 'installation'
  | 'lancement'
  | 'sante'
  | 'tests'
  | 'documentation'
  | 'release'
  | 'reseau'
  | 'securite'
  | 'backup'
  | 'tv'
  | 'all';

export type HelpNetworkState = 'checking' | 'online' | 'offline' | 'degraded' | 'unknown';

export interface HelpSystemStatus {
  networkState: HelpNetworkState;
  backendOk: boolean | null;
  frontendOk: boolean | null;
  phase: number | null;
  unreadNotifications: number | null;
  schedulerActive: boolean | null;
  observabilityOk: boolean | null;
  backupAvailable: boolean | null;
  securityLocalOnly: boolean | null;
  loading: boolean;
  error: string | null;
  lastCheckedAt: string | null;
}

// Phase 27 — Observabilité temps réel + événements système

export type SystemEventSeverity = 'info' | 'success' | 'warning' | 'error';
export type SystemEventSource =
  | 'backend'
  | 'frontend'
  | 'network'
  | 'scheduler'
  | 'backup'
  | 'security'
  | 'notifications';

export interface SystemEvent {
  id: string;
  timestamp: string;
  type: string;
  severity: SystemEventSeverity;
  source: SystemEventSource;
  message: string;
  details?: string;
  read: boolean;
}

export interface SystemEventFilter {
  severity: SystemEventSeverity | 'all';
  source: SystemEventSource | 'all';
}

// Phase 24 - Assistant vocal local
export type VoiceCommandIntent =
  | 'navigate'
  | 'refresh'
  | 'openPanel'
  | 'readStatus'
  | 'toggleTvMode'
  | 'toggleFullscreen'
  | 'showNotifications'
  | 'showScheduler'
  | 'showObservability'
  | 'help'
  | 'smartthingsScene'
  | 'tvCommand'
  | 'streamingPlay'
  | 'backupRestore'
  | 'auditClear'
  | 'profileChange';

export type VoicePermissionState = 'unknown' | 'prompt' | 'granted' | 'denied' | 'unsupported';

export interface VoiceCommand {
  transcript: string;
  intent: VoiceCommandIntent;
  label: string;
  targetSection?: string;
  activePanel?: TvModeState['activePanel'];
  sensitive: boolean;
  confidence: number;
}

export interface VoiceCommandResult {
  ok: boolean;
  intent: VoiceCommandIntent;
  message: string;
  blocked: boolean;
  transcript: string;
  targetSection?: string;
}

export interface VoiceTranscriptEntry {
  id: string;
  at: string;
  transcript: string;
  result: VoiceCommandResult;
}

export interface VoiceAssistantState {
  isSupported: boolean;
  isListening: boolean;
  permissionState: VoicePermissionState;
  transcript: string;
  transcriptHistory: VoiceTranscriptEntry[];
  lastResult: VoiceCommandResult | null;
}

/* ---- Phase 31 — Centre de notifications intelligent ---- */

export type LocalNotificationSeverity = 'info' | 'success' | 'warning' | 'error';
export type LocalNotificationSource =
  | 'system' | 'network' | 'backup' | 'scheduler'
  | 'security' | 'sse' | 'frontend' | 'backend';

export interface LocalNotification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  severity: LocalNotificationSeverity;
  source: LocalNotificationSource;
  read: boolean;
  groupKey?: string;
  count?: number;
  relatedEventIds?: string[];
}

export interface LocalNotificationFilter {
  severity: LocalNotificationSeverity | 'all';
  source: LocalNotificationSource | 'all';
}

/* ---- Phase 32 — Tableau de bord diagnostic avancé ---- */

export type DiagnosticStatus = 'healthy' | 'degraded' | 'offline' | 'unknown';
export type DiagnosticEntryStatus = 'ok' | 'degraded' | 'offline' | 'unknown';

export interface DiagnosticEntry {
  status: DiagnosticEntryStatus;
  label: string;
  detail?: string;
  score: number;
}

export interface DiagnosticSnapshot {
  timestamp: string;
  overallStatus: DiagnosticStatus;
  score: number;
  backend: DiagnosticEntry;
  frontend: DiagnosticEntry;
  sse: DiagnosticEntry;
  network: DiagnosticEntry;
  storage: DiagnosticEntry;
  scheduler: DiagnosticEntry;
  backup: DiagnosticEntry;
  notifications: DiagnosticEntry;
  security: DiagnosticEntry;
}

export interface DiagnosticsApiResponse {
  timestamp: string;
  status: string;
  uptime: number;
  nodeVersion: string;
  memory: { rss: number; heapUsed: number; heapTotal: number };
  scheduler: {
    status: string;
    running: boolean;
    activeSchedules: number;
    totalSchedules: number;
    tickMs: number | null;
    nextScheduled: { name: string; at: string } | null;
  };
  backup: {
    enabled: boolean;
    count: number;
    latest: { backupId: string; createdAt: string } | null;
  };
  notifications: { total: number; unread: number };
  sse: { clients: number };
  security: { localOnly: boolean; firebase: boolean; cloudServices: boolean; externalPush: boolean };
}

/* ── Phase 45 — IA locale ──────────────────────────────────────────── */

export interface AiSafetyFlags {
  localOnly:                boolean;
  noCloudAllowed:           boolean;
  noAutoExecution:          boolean;
  ollamaLocalOnly:          boolean;
  maxInputChars:            number;
  secretMaskingEnabled:     boolean;
  dangerousCommandBlocking: boolean;
  suggestionsAreDryRunOnly: boolean;
}

export interface AiStatusResponse {
  enabled:    boolean;
  provider:   string;
  model:      string;
  available:  boolean;
  reason:     string | null;
  ollamaUrl?: string;
  safety:     AiSafetyFlags;
}

export interface AiModel {
  name: string;
  size?: number;
}

export interface AiModelsResponse {
  models: AiModel[];
  total:  number;
}

export interface AiChatResponse {
  ok:       boolean;
  response: string | null;
  error:    string | null;
}

export interface AiCommandResponse {
  ok:      boolean;
  command: string | null;
  safe:    boolean;
  dryRun:  boolean;
  error:   string | null;
  reason?: string;
}

export interface AiChatMessage {
  role:    'user' | 'assistant';
  content: string;
  ts:      string;
}

// ── Phase 46 — RAG local ──────────────────────────────────────────────────────

export interface RagSafetyFlags {
  localOnly:              boolean;
  noCloudAllowed:         boolean;
  sourceAllowlist:        boolean;
  pathTraversalBlocked:   boolean;
  secretMaskingEnabled:   boolean;
  maxFileSizeMB:          number;
  maxQuestionChars:       number;
  citationsLocalOnly:     boolean;
}

export interface RagIndexedSource {
  path:   string;
  chunks: number;
  size:   number;
}

export interface RagStatusResponse {
  workspaceId?:    string;
  indexed:        boolean;
  chunkCount:     number;
  sources:        RagIndexedSource[];
  mode:           'embedding' | 'lexical' | null;
  embeddingModel: string | null;
  indexedAt:      string | null;
  checksum:       string | null;
  ragVersion:     string | null;
  aiEnabled:      boolean;
  safety:         RagSafetyFlags;
}

export interface RagCitation {
  index:   number;
  source:  string;
  heading: string;
  excerpt: string;
  score:   number | null;
}

export interface RagSearchResponse {
  ok:      boolean;
  workspaceId?: string;
  query:   string;
  chunks:  RagCitation[];
  mode:    string;
  indexed: boolean;
  total:   number;
  error?:  string;
}

export interface RagAskResponse {
  ok:        boolean;
  workspaceId?: string;
  response:  string | null;
  error:     string | null;
  citations: RagCitation[];
  mode:      string;
  indexed:   boolean;
}

// ── Phase 47 — Agents IA locaux orchestres ───────────────────────────────────

export interface AgentManifest {
  id:                string;
  name:              string;
  description:       string;
  model:             string;
  tools:             string[];
  permissions:       string[];
  enabled:           boolean;
  localOnly:         boolean;
  dryRun:            boolean;
  requiresCitations?: boolean;
}

export interface AgentSafetyFlags {
  localOnly:               boolean;
  noCloudAllowed:          boolean;
  noAutoExecution:         boolean;
  dryRunByDefault:         boolean;
  humanValidationRequired: boolean;
  secretMaskingEnabled:    boolean;
  allowedTools:            string[];
  forbiddenTools:          string[];
  maxSteps:                number;
  maxContextChars:         number;
}

export interface AgentStepResult {
  tool:   string;
  input:  string;
  output: string;
  ok:     boolean;
  error:  string | null;
}

export interface AgentRunStep {
  agentId:         string;
  agentName:       string;
  steps:           AgentStepResult[];
  output:          string | null;
  ok:              boolean;
  error:           string | null;
  citations:       RagCitation[];
  rejectedActions: { tool: string; reason: string }[];
  dryRun:          boolean;
}

export interface AgentRecommendation {
  agentId:   string;
  agentName: string;
  text:      string;
  dryRun:    boolean;
}

export interface AgentSafetySummary {
  localOnly:       boolean;
  dryRun:          boolean;
  noAutoExecution: boolean;
  agentsRun:       number;
  agentsFailed:    number;
  rejectedTotal:   number;
}

export interface AgentRunResult {
  ok:              boolean;
  workspaceId?:    string;
  runId:           string;
  status:          'completed' | 'failed' | 'pending';
  task:            string;
  agentsUsed:      string[];
  steps:           AgentRunStep[];
  recommendations: AgentRecommendation[];
  citations:       RagCitation[];
  rejectedActions: { tool: string; reason: string }[];
  safetySummary:   AgentSafetySummary | null;
  summary:         string | null;
  startedAt:       string;
  completedAt:     string | null;
  dryRun:          boolean;
  error?:          string;
}

export interface AgentRunMeta {
  runId:       string;
  workspaceId?: string;
  task:        string;
  agentsUsed:  string[];
  status:      string;
  startedAt:   string;
  completedAt: string | null;
}

export interface AgentsListResponse {
  workspaceId?: string;
  agents: AgentManifest[];
  total:  number;
  safety: AgentSafetyFlags;
}

export interface AgentsRunsResponse {
  workspaceId?: string;
  runs:  AgentRunMeta[];
  total: number;
}

// ── Phase 48 — Workflows IA visuels ──────────────────────────────────────────

export type WorkflowNodeType =
  | 'agent' | 'rag-search' | 'rag-ask' | 'diagnostic'
  | 'notification' | 'condition' | 'delay'
  | 'safe-command-suggestion' | 'plugin-tool';

export interface WorkflowNode {
  id:         string;
  type:       WorkflowNodeType;
  label?:     string;
  dependsOn?: string[];
  agentId?:   string;
  query?:     string;
  question?:  string;
  message?:   string;
  severity?:  string;
  condition?: string;
  delayMs?:   number;
  task?:      string;
}

export interface WorkflowEdge {
  from: string;
  to:   string;
}

export interface WorkflowTrigger {
  type: 'manual' | 'interval' | 'startup';
  intervalMs?: number;
}

export interface WorkflowDefinition {
  id:           string;
  name:         string;
  description:  string;
  version:      string;
  enabled:      boolean;
  localOnly:    boolean;
  dryRun:       boolean;
  nodes:        WorkflowNode[];
  edges:        WorkflowEdge[];
  triggers:     WorkflowTrigger[];
  createdAt?:   string;
  updatedAt?:   string;
  _isTemplate?: boolean;
}

export interface WorkflowSummary {
  id:          string;
  name:        string;
  description: string;
  version:     string;
  enabled:     boolean;
  localOnly:   boolean;
  dryRun:      boolean;
  nodeCount:   number;
  _isTemplate: boolean;
}

export interface WorkflowNodeResult {
  nodeId:  string;
  label:   string;
  type:    string;
  ok:      boolean;
  output:  string | null;
  error:   string | null;
  dryRun:  boolean;
}

export interface WorkflowSafetySummary {
  localOnly:       boolean;
  dryRun:          boolean;
  noAutoExecution: boolean;
  nodesRun:        number;
  nodesFailed:     number;
  rejectedTotal:   number;
}

export interface WorkflowRunResult {
  ok:              boolean;
  workspaceId?:    string;
  runId:           string;
  workflowId:      string;
  workflowName:    string;
  status:          'completed' | 'failed';
  nodeResults:     WorkflowNodeResult[];
  citations:       RagCitation[];
  rejectedActions: { nodeId: string; type: string; reason: string }[];
  safetySummary:   WorkflowSafetySummary | null;
  summary:         string | null;
  startedAt:       string;
  completedAt:     string | null;
  dryRun:          boolean;
  error?:          string;
}

export interface WorkflowRunMeta {
  runId:        string;
  workspaceId?: string;
  workflowId:   string;
  workflowName: string;
  status:       string;
  startedAt:    string;
  completedAt:  string | null;
}

export interface WorkflowsSafetyFlags {
  localOnly:               boolean;
  noCloudAllowed:          boolean;
  noAutoExecution:         boolean;
  dryRunByDefault:         boolean;
  humanValidationRequired: boolean;
  secretMaskingEnabled:    boolean;
  maxNodes:                number;
  maxWorkflowJsonBytes:    number;
  forbiddenNodeTypes:      string[];
}

export interface WorkflowsListResponse {
  workspaceId?: string;
  workflows: WorkflowSummary[];
  total:     number;
  safety:    WorkflowsSafetyFlags;
}

export interface WorkflowTemplateSummary {
  id:          string;
  name:        string;
  description: string;
  version:     string;
  nodeCount:   number;
  localOnly:   boolean;
  dryRun:      boolean;
}

export interface WorkflowRunsResponse {
  workspaceId?: string;
  runs:  WorkflowRunMeta[];
  total: number;
}

// ── Phase 49 — Mémoire persistante IA ────────────────────────────────────────

export type MemoryItemType =
  | 'preference' | 'fact' | 'summary' | 'workflow-result'
  | 'agent-result' | 'diagnostic-insight' | 'note';

export type MemoryScope  = 'user' | 'project' | 'system' | 'session';
export type MemorySource = 'chat' | 'agent' | 'workflow' | 'manual' | 'diagnostic';

export interface MemoryItem {
  id:              string;
  workspaceId?:    string;
  type:            MemoryItemType;
  scope:           MemoryScope;
  content:         string;
  tags:            string[];
  importance:      number;
  source:          MemorySource;
  createdAt:       string;
  updatedAt:       string;
  lastAccessedAt:  string;
  expiresAt:       string | null;
  localOnly:       true;
  embeddingHash:   string | null;
  _score?:         number;
}

export interface MemoryMeta {
  totalItems: number;
  byType:     Record<string, number>;
  byScope:    Record<string, number>;
  updatedAt:  string | null;
}

export interface MemorySafetyFlags {
  localOnly:             true;
  noCloudAllowed:        boolean;
  secretMaskingEnabled:  boolean;
  humanControlRequired:  boolean;
  exportSanitized:       boolean;
  memoryTypes:           string[];
  memoryScopes:          string[];
  maxItems:              number;
  maxItemChars:          number;
  embeddingsEnabled:     boolean;
  includeInRag:          boolean;
}

export interface MemoryRetentionStatus {
  totalItems:    number;
  maxItems:      number;
  retentionDays: number;
  byType:        Record<string, number>;
  byScope:       Record<string, number>;
}

export interface MemoryListResponse {
  workspaceId?: string;
  items:  MemoryItem[];
  total:  number;
  meta:   MemoryMeta;
  safety: MemorySafetyFlags;
}

export interface MemoryStatusResponse {
  ok:        boolean;
  workspaceId?: string;
  enabled:   boolean;
  safety:    MemorySafetyFlags;
  retention: MemoryRetentionStatus;
}

export interface MemorySearchResponse {
  ok:      boolean;
  workspaceId?: string;
  results: MemoryItem[];
  total:   number;
  query:   string;
}

export interface MemorySummaryResponse {
  ok:      boolean;
  summary: string;
  method:  'ai' | 'extractive' | 'empty';
  model?:  string;
  items:   number;
}

// ── Phase 50 — Base de connaissances locale ───────────────────────────────────

export type KnowledgeItemType = 'memory' | 'rag' | 'workflow' | 'agent' | 'diagnostic' | 'plugin' | 'event' | 'note';
export type KnowledgeRelationType = 'related-to' | 'derived-from' | 'referenced-by' | 'causes' | 'solves' | 'extends' | 'summarizes';

export interface KnowledgeRelation {
  targetId:  string;
  type:      KnowledgeRelationType;
  createdAt?: string;
}

export interface KnowledgeItem {
  id:         string;
  type:       KnowledgeItemType;
  title:      string;
  content:    string;
  sourceId?:  string;
  tags:       string[];
  entities:   string[];
  relations:  KnowledgeRelation[];
  importance: number;
  createdAt:  string;
  updatedAt:  string;
  localOnly:  true;
  _score?:    number;
  _citation?: KnowledgeCitation;
}

export interface KnowledgeCitation {
  id:         string;
  type:       KnowledgeItemType;
  title:      string;
  tags:       string[];
  entities:   string[];
  sourceId?:  string;
  importance: number;
  createdAt:  string;
}

export interface KnowledgeMeta {
  totalItems: number;
  byType:     Record<string, number>;
  bySource:   Record<string, number>;
  updatedAt:  string | null;
}

export interface KnowledgeSafetyFlags {
  localOnly:                 true;
  noCloudAllowed:            boolean;
  secretMaskingEnabled:      boolean;
  pathTraversalBlocked:      boolean;
  clearRequiresConfirmation: boolean;
  importExportDisabled:      boolean;
  embeddingsOptional:        boolean;
}

export interface KnowledgeGraphNode {
  id:         string;
  type:       KnowledgeItemType;
  title:      string;
  entities:   string[];
  tags:       string[];
  importance: number;
}

export interface KnowledgeGraphEdge {
  source: string;
  target: string;
  type:   KnowledgeRelationType;
}

export interface KnowledgeStatusResponse {
  ok:      boolean;
  workspaceId?: string;
  enabled: boolean;
  safety:  KnowledgeSafetyFlags;
  meta:    KnowledgeMeta;
}

export interface KnowledgeListResponse {
  ok:     boolean;
  workspaceId?: string;
  items:  KnowledgeItem[];
  total:  number;
  meta:   KnowledgeMeta;
  safety: KnowledgeSafetyFlags;
}

export interface KnowledgeSearchResponse {
  ok:      boolean;
  workspaceId?: string;
  results: KnowledgeItem[];
  total:   number;
  query:   string;
}

export interface KnowledgeGraphResponse {
  ok:          boolean;
  workspaceId?: string;
  nodes:       KnowledgeGraphNode[];
  edges:       KnowledgeGraphEdge[];
  totalNodes:  number;
  totalEdges:  number;
  generatedAt: string;
}

export interface KnowledgeCategorySummary {
  category: string;
  summary:  string;
  method:   'ai' | 'extractive' | 'empty' | 'error';
  items:    number;
}

export interface KnowledgeSummaryResponse {
  ok:        boolean;
  summaries: Record<string, KnowledgeCategorySummary>;
}

// ── Phase 51 — Recherche globale + Command Center ─────────────────────────────

export type SearchResultType = 'knowledge' | 'memory' | 'rag' | 'agent' | 'workflow' | 'plugin' | 'doc' | 'diagnostic' | 'command';

export interface SearchResult {
  id:          string;
  type:        SearchResultType;
  title:       string;
  description: string;
  score:       number;
  source:      string;
  target:      string | null;
  tags:        string[];
  actions:     string[];
  localOnly:   true;
  _commandId?: string;
  _sourceId?:  string;
}

export interface SearchCommand {
  id:             string;
  title:          string;
  description:    string;
  category:       string;
  target:         string | null;
  actions:        string[];
  tags:           string[];
  safe:           boolean;
  dryRunRequired: boolean;
}

export interface SearchSafetyFlags {
  localOnly:            true;
  noCloudAllowed:       boolean;
  secretMaskingEnabled: boolean;
  blockedActions:       string[];
  historyLocalOnly:     boolean;
  clearHistoryConfirm:  boolean;
}

export interface SearchStatusResponse {
  ok:       boolean;
  enabled:  boolean;
  safety:   SearchSafetyFlags;
  commands: number;
  indexed:  number;
}

export interface SearchResponse {
  ok:         boolean;
  results:    SearchResult[];
  groups:     Record<string, SearchResult[]>;
  total:      number;
  query:      string;
  suggestion: string | null;
}

export interface CommandPreviewResponse {
  ok:      boolean;
  preview: SearchCommand & { localOnly: true };
}

export interface CommandRunResponse {
  ok:      boolean;
  action:  string;
  target:  string | null;
  command: string;
  dryRun:  boolean;
  message?: string;
  query?:  string | null;
}

export interface SearchHistoryEntry {
  query:     string;
  timestamp: string;
  total:     number;
}

// ── Phase 52 — Profils utilisateur locaux et espaces de travail ───────────────

export interface WorkspaceSettings {
  theme:            'dark' | 'light' | 'system';
  language:         'fr' | 'en';
  aiEnabled:        boolean;
  ragEnabled:       boolean;
  memoryEnabled:    boolean;
  kbEnabled:        boolean;
  workflowsEnabled: boolean;
  agentsEnabled:    boolean;
}

export interface WorkspaceProfile {
  id:          string;
  name:        string;
  description: string;
  createdAt:   string;
  updatedAt:   string;
  isDefault:   boolean;
  localOnly:   true;
  settings:    WorkspaceSettings;
}

export interface WorkspaceSafetyFlags {
  localOnly:                    true;
  noCloudAllowed:               boolean;
  secretMaskingEnabled:         boolean;
  pathTraversalBlocked:         boolean;
  deleteCurrentBlocked:         boolean;
  deleteDefaultRequiresConfirm: boolean;
  exportSanitized:              boolean;
  importStrictValidation:       boolean;
}

export interface WorkspaceStatusResponse {
  ok:      boolean;
  enabled: boolean;
  current: string;
  total:   number;
  safety:  WorkspaceSafetyFlags;
  migration?: {
    ok: boolean;
    workspaceId: string;
    legacyDetected: boolean;
    destructive: boolean;
  };
}

export interface WorkspaceListResponse {
  ok:       boolean;
  profiles: WorkspaceProfile[];
  total:    number;
  current:  string;
}

export interface WorkspaceSwitchResponse {
  ok:      boolean;
  current: WorkspaceProfile;
}

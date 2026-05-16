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

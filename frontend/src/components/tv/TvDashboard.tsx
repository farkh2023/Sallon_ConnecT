'use client';

import { useCallback, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import { useBackendHealth } from '@/hooks/useBackendHealth';
import { useTvMode } from '@/hooks/useTvMode';
import { maskSensitiveClientText } from '@/lib/safety';
import { formatDate } from '@/lib/format';
import type {
  AdbStatus,
  DlnaStatus,
  NotificationItem,
  NotificationStats,
  Schedule,
  SchedulerStatus,
  SmartThingsStatus,
  StreamingPolicy,
} from '@/lib/types';
import { FullscreenButton } from './FullscreenButton';
import { TvQuickActions } from './TvQuickActions';

interface DevicesResp {
  count: number;
  devices: { liveStatus?: string }[];
}

interface StreamingPolicyResp {
  policy: StreamingPolicy;
}

interface SchedulesResp {
  schedules: Schedule[];
}

interface NotificationsResp {
  notifications: NotificationItem[];
}

interface SmartTvResp {
  status?: string;
  enabled?: boolean;
  configured?: boolean;
  tvConfigured?: boolean;
  tvDeviceConfigured?: boolean;
}

function statusText(value: unknown, fallback = 'Indisponible') {
  if (typeof value === 'boolean') return value ? 'Actif' : 'Inactif';
  if (typeof value === 'string' && value.trim()) return maskSensitiveClientText(value);
  return fallback;
}

function statusTone(value: boolean | null | undefined): string {
  if (value === true) return 'text-emerald-300';
  if (value === false) return 'text-yellow-300';
  return 'text-slate-300';
}

export function TvDashboard() {
  const tv = useTvMode();
  const health = useBackendHealth(30_000);
  const devices = useApi<DevicesResp>('/api/devices');
  const smartTv = useApi<SmartTvResp>('/api/smartthings/tv');
  const adb = useApi<AdbStatus>('/api/adb/status');
  const dlna = useApi<DlnaStatus>('/api/dlna/status');
  const smartThings = useApi<SmartThingsStatus>('/api/smartthings/status');
  const streaming = useApi<StreamingPolicyResp>('/api/streaming/policy');
  const notifications = useApi<NotificationStats>('/api/notifications/stats');
  const notificationList = useApi<NotificationsResp>('/api/notifications?limit=12');
  const scheduler = useApi<SchedulerStatus>('/api/scheduler/status');
  const schedules = useApi<SchedulesResp>('/api/scheduler/schedules');

  const refreshAll = useCallback(() => {
    void health.refresh();
    devices.refresh();
    smartTv.refresh();
    adb.refresh();
    dlna.refresh();
    smartThings.refresh();
    streaming.refresh();
    notifications.refresh();
    notificationList.refresh();
    scheduler.refresh();
    schedules.refresh();
  }, [
    adb,
    devices,
    dlna,
    health,
    notificationList,
    notifications,
    schedules,
    scheduler,
    smartThings,
    smartTv,
    streaming,
  ]);

  useEffect(() => {
    const handler = () => refreshAll();
    window.addEventListener('sallon:tv-refresh', handler);
    return () => window.removeEventListener('sallon:tv-refresh', handler);
  }, [refreshAll]);

  const onlineDevices = devices.data?.devices.filter((device) => device.liveStatus === 'online').length ?? 0;
  const totalDevices = devices.data?.count ?? 0;
  const nextSchedules = (schedules.data?.schedules ?? [])
    .filter((schedule) => schedule.enabled && schedule.nextRunAt)
    .sort((a, b) => String(a.nextRunAt).localeCompare(String(b.nextRunAt)))
    .slice(0, 3);
  const latestSecurity = (notificationList.data?.notifications ?? []).find(
    (item) => item.level === 'security' || item.type === 'security'
  );

  return (
    <section id="tv-dashboard" className="tv-dashboard" aria-label="Mode TV avance">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-300">
            Mode TV avance
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-50 sm:text-4xl">
            Tableau de bord grand ecran
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Navigation clavier et telecommande: T, F, R, H, N, S, Echap, fleches et Entree.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={tv.requestRefresh}
            className="tv-primary-button"
          >
            Actualiser
          </button>
          <FullscreenButton />
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatusTile
          label="Backend"
          value={health.backendStatus === 'online' ? 'En ligne' : statusText(health.message, 'Indisponible')}
          tone={statusTone(health.backendStatus === 'online')}
        />
        <StatusTile
          label="Appareils"
          value={`${onlineDevices}/${totalDevices} en ligne`}
          tone={statusTone(totalDevices > 0 ? onlineDevices > 0 : null)}
        />
        <StatusTile
          label="Smart TV"
          value={statusText(smartTv.data?.status ?? smartTv.data?.configured ?? smartTv.data?.tvConfigured)}
          tone={statusTone(Boolean(smartTv.data?.enabled ?? smartTv.data?.configured ?? smartTv.data?.tvConfigured))}
        />
        <StatusTile
          label="Notifications non lues"
          value={String(notifications.data?.unread ?? 0)}
          tone={statusTone((notifications.data?.unread ?? 0) === 0)}
        />
        <StatusTile
          label="ADB"
          value={adb.data?.enabled ? statusText(adb.data.status, 'Active') : 'Desactive'}
          tone={statusTone(adb.data?.enabled)}
        />
        <StatusTile
          label="DLNA"
          value={dlna.data?.enabled ? statusText(dlna.data.status, 'Active') : 'Desactive'}
          tone={statusTone(dlna.data?.enabled)}
        />
        <StatusTile
          label="SmartThings"
          value={smartThings.data?.enabled ? statusText(smartThings.data.status, 'Actif') : 'Desactive'}
          tone={statusTone(smartThings.data?.enabled)}
        />
        <StatusTile
          label="Streaming"
          value={streaming.data?.policy.enabled ? 'Assiste actif' : 'Desactive'}
          tone={statusTone(streaming.data?.policy.enabled)}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="tv-info-panel">
          <h3 className="text-lg font-semibold text-slate-100">Prochaines taches scheduler</h3>
          {nextSchedules.length > 0 ? (
            <div className="mt-4 space-y-3">
              {nextSchedules.map((schedule) => (
                <div key={schedule.id} className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
                  <span className="text-sm font-medium text-slate-200">
                    {maskSensitiveClientText(schedule.name)}
                  </span>
                  <span className="shrink-0 text-sm text-slate-400">{formatDate(schedule.nextRunAt)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Aucune tache planifiee imminente.</p>
          )}
        </div>

        <div className="tv-info-panel">
          <h3 className="text-lg font-semibold text-slate-100">Dernier evenement securite</h3>
          {latestSecurity ? (
            <div className="mt-4 space-y-2">
              <p className="text-base font-semibold text-red-200">
                {maskSensitiveClientText(latestSecurity.title)}
              </p>
              <p className="text-sm text-slate-400">{maskSensitiveClientText(latestSecurity.message)}</p>
              <p className="text-xs text-slate-500">{formatDate(latestSecurity.createdAt)}</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Aucun evenement securite recent.</p>
          )}
        </div>
      </div>

      <div className="mt-6">
        <TvQuickActions />
      </div>
    </section>
  );
}

function StatusTile({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="tv-status-tile">
      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className={`mt-3 text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}

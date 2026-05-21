'use client';

import { useBackendHealth } from '@/hooks/useBackendHealth';

export function OfflineStatus() {
  const status = useBackendHealth(30_000);

  if (status.backendStatus === 'checking' || status.backendStatus === 'unknown') {
    return <span className="offline-badge bg-slate-400/15 text-slate-400">Vérification…</span>;
  }

  if (!status.online) {
    return <span className="offline-badge bg-danger/15 text-red-300">Hors ligne</span>;
  }

  if (status.backendStatus === 'offline') {
    return (
      <button
        type="button"
        onClick={status.refresh}
        className="offline-badge bg-warning/15 text-yellow-300 hover:bg-warning/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral"
      >
        Backend local indisponible
      </button>
    );
  }

  if (status.backendStatus === 'degraded') {
    return <span className="offline-badge bg-warning/15 text-yellow-300">Backend dégradé</span>;
  }

  return <span className="offline-badge bg-success/15 text-emerald-300">En ligne</span>;
}

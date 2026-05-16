'use client';

import { useApi } from '@/hooks/useApi';
import { Badge } from '@/components/ui/Badge';
import { SafetyNotice } from '@/components/ui/SafetyNotice';
import type { StreamingPolicy } from '@/lib/types';

interface PolicyResp { policy: StreamingPolicy }

export function StreamingPanel() {
  const { data, loading, error } = useApi<PolicyResp>('/api/streaming/policy');
  const p = data?.policy;

  return (
    <div className="space-y-3">
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-slate-300">Politique streaming</p>
          {p && <Badge color={p.enabled ? 'green' : 'gray'}>{p.enabled ? 'Activé' : 'Désactivé'}</Badge>}
        </div>

        {loading && <div className="h-16 animate-pulse bg-white/[0.05] rounded" />}
        {error   && <p className="text-xs text-red-400">{error}</p>}

        {p && (
          <div className="text-xs text-slate-500 space-y-1.5">
            <Row label="Confirmation requise"   value={p.requireConfirmation ? 'Oui ✓' : 'Non'} />
            <Row label="Extensions autorisées"  value={p.allowedExtensions} />
            <Row label="Taille max"             value={`${p.maxFileMb} Mo`} />
            <Row label="Chemins masqués"        value={p.maskPaths ? 'Oui ✓' : 'Non'} />
            <Row label="Audit activé"           value={p.auditEnabled ? 'Oui ✓' : 'Non'} />
            <Row label="DLNA streaming"         value={p.dlnaStreamingEnabled ? 'Oui' : 'Non'} />
            <Row label="Renderer allowlist"     value={p.rendererAllowlistConfigured ? 'Configurée ✓' : 'Non configurée'} />
          </div>
        )}
      </div>

      <SafetyNotice>Mode assisté uniquement — aucune lecture automatique. Confirmation requise avant envoi.</SafetyNotice>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span>{label}</span>
      <span className="text-slate-400 text-right">{value}</span>
    </div>
  );
}

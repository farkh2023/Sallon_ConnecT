'use client';

import { useApi } from '@/hooks/useApi';
import { Badge } from '@/components/ui/Badge';
import { SafetyNotice } from '@/components/ui/SafetyNotice';

interface STStatusResp {
  enabled: boolean; status: string; readOnly: boolean;
  tokenConfigured?: boolean; tvDeviceConfigured?: boolean;
}

export function SmartThingsPanel() {
  const { data, loading, error } = useApi<STStatusResp>('/api/smartthings/status');

  return (
    <div className="space-y-3">
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-slate-300">SmartThings Samsung TV</p>
          {data && <Badge color={data.enabled ? 'green' : 'gray'}>{data.enabled ? 'Activé' : 'Désactivé'}</Badge>}
        </div>

        {loading && <div className="h-8 animate-pulse bg-white/[0.05] rounded" />}
        {error   && <p className="text-xs text-red-400">{error}</p>}
        {data    && (
          <div className="text-xs text-slate-500 space-y-1.5">
            <Row label="Lecture seule"     value={data.readOnly ? 'Oui ✓' : 'Non'} ok={data.readOnly} />
            <Row label="Token configuré"   value={data.tokenConfigured ? 'Oui' : 'Non'} ok={!!data.tokenConfigured} />
            <Row label="TV configurée"     value={data.tvDeviceConfigured ? 'Oui' : 'Non'} ok={!!data.tvDeviceConfigured} />
            <Row label="Statut"            value={data.status} />
          </div>
        )}
      </div>

      <SafetyNotice>Token SmartThings jamais exposé — lecture seule par défaut. Aucune commande automatique.</SafetyNotice>
    </div>
  );
}

function Row({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span>{label}</span>
      <span className={ok === true ? 'text-emerald-400' : ok === false ? 'text-slate-400' : 'text-slate-400'}>{value}</span>
    </div>
  );
}

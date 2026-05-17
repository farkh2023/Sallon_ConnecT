'use client';

import type { ProfileAuditEntry } from '@/lib/types';

interface ProfileAuditProps {
  entries: ProfileAuditEntry[];
  loading: boolean;
  onLoad: () => void;
  onClear: () => void;
  canClear: boolean;
}

const EVENT_LABEL: Record<string, string> = {
  profile_switch: 'Basculement',
  profile_create: 'Création',
  profile_update: 'Modification',
  profile_delete: 'Suppression',
};

export function ProfileAudit({ entries, loading, onLoad, onClear, canClear }: ProfileAuditProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={onLoad}
          disabled={loading}
          className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          {loading ? 'Chargement…' : 'Actualiser'}
        </button>
        {canClear && entries.length > 0 && (
          <button
            onClick={onClear}
            className="px-3 py-1 text-xs bg-red-900/50 hover:bg-red-800/60 text-red-300 rounded focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            Effacer l&apos;audit
          </button>
        )}
        <span className="text-xs text-slate-500">{entries.length} entrée{entries.length !== 1 ? 's' : ''}</span>
      </div>

      {entries.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-4">Aucune entr&eacute;e d&apos;audit.</p>
      ) : (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {entries.slice(0, 50).map((e, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-slate-400 border-b border-white/[0.04] py-1">
              <span className="text-slate-600 shrink-0">
                {new Date(e.at).toLocaleString('fr-FR', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-slate-300">{EVENT_LABEL[e.event] ?? e.event}</span>
              {e.profileName && <span className="truncate text-slate-500">{e.profileName}</span>}
              {e.profileType && <span className="text-slate-600">({e.profileType})</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

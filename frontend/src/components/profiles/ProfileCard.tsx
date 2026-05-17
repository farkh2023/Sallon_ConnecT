'use client';

import type { UserProfile } from '@/lib/types';

const TYPE_LABEL: Record<string, string> = {
  owner: 'Propriétaire',
  family: 'Famille',
  guest: 'Invité',
  tv: 'TV',
  diagnostic: 'Diagnostic',
};

const TYPE_COLOR: Record<string, string> = {
  owner: 'bg-blue-900/40 text-blue-300 border-blue-800/40',
  family: 'bg-green-900/40 text-green-300 border-green-800/40',
  guest: 'bg-slate-800/40 text-slate-400 border-slate-700/40',
  tv: 'bg-purple-900/40 text-purple-300 border-purple-800/40',
  diagnostic: 'bg-orange-900/40 text-orange-300 border-orange-800/40',
};

interface ProfileCardProps {
  profile: UserProfile;
  isActive: boolean;
  canManage: boolean;
  onActivate: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ProfileCard({ profile, isActive, canManage, onActivate, onEdit, onDelete }: ProfileCardProps) {
  const colorClass = TYPE_COLOR[profile.type] ?? TYPE_COLOR.guest;
  const sections = (profile.preferences?.visibleSections ?? []).join(', ') || '—';

  return (
    <div className={`rounded-lg border p-4 space-y-3 ${isActive ? 'border-blue-600/60 bg-blue-950/10' : 'border-white/[0.08] bg-white/[0.02]'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-100 text-sm truncate">{profile.name}</span>
            {isActive && (
              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">ACTIF</span>
            )}
            {!profile.enabled && (
              <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] text-slate-400">Désactivé</span>
            )}
          </div>
          <span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium ${colorClass}`}>
            {TYPE_LABEL[profile.type] ?? profile.type}
          </span>
        </div>
      </div>

      <div className="text-xs text-slate-500 space-y-1">
        <div><span className="text-slate-400">Sections :</span> {sections}</div>
        <div>
          <span className="text-slate-400">Mode TV :</span>{' '}
          {profile.preferences?.tvModeDefault ? <span className="text-blue-400">Oui</span> : 'Non'}
          {' · '}
          <span className="text-slate-400">Lecture seule :</span>{' '}
          {profile.safety?.readOnlyMode ? <span className="text-yellow-400">Oui</span> : 'Non'}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {!isActive && (
          <button
            onClick={onActivate}
            className="px-3 py-1 text-xs bg-blue-700 hover:bg-blue-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Activer
          </button>
        )}
        {canManage && (
          <button
            onClick={onEdit}
            className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Modifier
          </button>
        )}
        {canManage && profile.type !== 'owner' && profile.id !== 'main' && (
          <button
            onClick={onDelete}
            className="px-3 py-1 text-xs bg-red-900/50 hover:bg-red-800/60 text-red-300 rounded focus:outline-none focus:ring-2 focus:ring-red-400"
            aria-label={`Supprimer ${profile.name}`}
          >
            Supprimer
          </button>
        )}
      </div>
    </div>
  );
}

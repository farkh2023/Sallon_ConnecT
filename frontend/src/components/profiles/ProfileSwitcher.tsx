'use client';

import { useState } from 'react';
import type { UserProfile } from '@/lib/types';

const TYPE_LABEL: Record<string, string> = {
  owner: 'Propriétaire',
  family: 'Famille',
  guest: 'Invité',
  tv: 'TV',
  diagnostic: 'Diagnostic',
};

const TYPE_SHORT: Record<string, string> = {
  owner: 'OW',
  family: 'FA',
  guest: 'GU',
  tv: 'TV',
  diagnostic: 'DX',
};

interface ProfileSwitcherProps {
  profiles: UserProfile[];
  activeProfile: UserProfile | null;
  onActivate: (id: string) => void;
  loading?: boolean;
}

export function ProfileSwitcher({ profiles, activeProfile, onActivate, loading = false }: ProfileSwitcherProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (id: string) => {
    setOpen(false);
    onActivate(id);
  };

  const shortLabel = activeProfile
    ? TYPE_SHORT[activeProfile.type] ?? 'P'
    : 'P';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-slate-300 border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        aria-label="Sélecteur de profil"
        aria-expanded={open}
      >
        <span className="rounded-full bg-blue-800/60 px-1.5 py-0.5 text-[10px] font-bold text-blue-200">
          {shortLabel}
        </span>
        <span className="max-w-[80px] truncate hidden sm:block">
          {activeProfile?.name ?? 'Profil'}
        </span>
        <span className="text-slate-500">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-lg border border-white/[0.08] bg-gray-900 shadow-xl">
          <div className="p-1">
            {profiles.map(p => (
              <button
                key={p.id}
                onClick={() => p.id && handleSelect(p.id)}
                disabled={!p.enabled}
                className={`w-full flex items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-white/[0.06] disabled:opacity-40 ${activeProfile?.id === p.id ? 'text-blue-300' : 'text-slate-300'}`}
              >
                <span className="rounded bg-gray-700 px-1 py-0.5 text-[9px] text-gray-400 font-mono">
                  {TYPE_SHORT[p.type] ?? 'P'}
                </span>
                <span className="truncate">{p.name}</span>
                {activeProfile?.id === p.id && <span className="ml-auto text-blue-400 text-[10px]">●</span>}
              </button>
            ))}
          </div>
          <div className="border-t border-white/[0.06] p-1">
            <p className="px-2 py-1 text-[10px] text-slate-600">
              {TYPE_LABEL[activeProfile?.type ?? ''] ?? 'Profil'} · local uniquement
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

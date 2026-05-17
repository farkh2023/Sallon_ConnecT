'use client';

import { useState } from 'react';
import type { UserProfile, ProfileType } from '@/lib/types';

const PROFILE_TYPES: { value: ProfileType; label: string }[] = [
  { value: 'owner', label: 'Propriétaire' },
  { value: 'family', label: 'Famille' },
  { value: 'guest', label: 'Invité' },
  { value: 'tv', label: 'TV' },
  { value: 'diagnostic', label: 'Diagnostic' },
];

const ALL_SECTIONS = ['dashboard', 'devices', 'media', 'scenarios', 'notifications', 'scheduler', 'observability'];

interface ProfileEditorProps {
  profile?: Partial<UserProfile>;
  onSave: (data: Partial<UserProfile>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function ProfileEditor({ profile, onSave, onCancel, loading = false }: ProfileEditorProps) {
  const [name, setName] = useState(profile?.name ?? '');
  const [type, setType] = useState<ProfileType>(profile?.type ?? 'guest');
  const [tvMode, setTvMode] = useState(profile?.preferences?.tvModeDefault ?? false);
  const [compact, setCompact] = useState(profile?.preferences?.compactMode ?? false);
  const [readOnly, setReadOnly] = useState(profile?.safety?.readOnlyMode ?? false);
  const [sections, setSections] = useState<string[]>(profile?.preferences?.visibleSections ?? ALL_SECTIONS);

  const toggleSection = (s: string) => {
    setSections(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      name: name.trim().slice(0, 40),
      type,
      preferences: {
        ...profile?.preferences,
        tvModeDefault: tvMode,
        compactMode: compact,
        visibleSections: sections,
      } as UserProfile['preferences'],
      safety: {
        ...profile?.safety,
        readOnlyMode: readOnly,
      } as UserProfile['safety'],
    });
  };

  return (
    <form onSubmit={e => void handleSubmit(e)} className="space-y-4 rounded-lg border border-white/[0.08] bg-white/[0.02] p-4">
      <div>
        <label className="block text-xs text-slate-400 mb-1" htmlFor="profile-name">Nom du profil</label>
        <input
          id="profile-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={40}
          required
          className="w-full rounded bg-gray-900 border border-gray-600 text-slate-100 text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Nom du profil"
        />
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1" htmlFor="profile-type">Type</label>
        <select
          id="profile-type"
          value={type}
          onChange={e => setType(e.target.value as ProfileType)}
          className="w-full rounded bg-gray-900 border border-gray-600 text-slate-100 text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {PROFILE_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <p className="text-xs text-slate-400 mb-2">Sections visibles</p>
        <div className="flex flex-wrap gap-2">
          {ALL_SECTIONS.map(s => (
            <label key={s} className="flex items-center gap-1 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={sections.includes(s)}
                onChange={() => toggleSection(s)}
                className="accent-blue-500"
              />
              {s}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs">
        <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
          <input type="checkbox" checked={tvMode} onChange={e => setTvMode(e.target.checked)} className="accent-blue-500" />
          Mode TV par défaut
        </label>
        <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
          <input type="checkbox" checked={compact} onChange={e => setCompact(e.target.checked)} className="accent-blue-500" />
          Mode compact
        </label>
        <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
          <input type="checkbox" checked={readOnly} onChange={e => setReadOnly(e.target.checked)} className="accent-blue-500" />
          Lecture seule
        </label>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="px-4 py-1.5 text-sm bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {loading ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

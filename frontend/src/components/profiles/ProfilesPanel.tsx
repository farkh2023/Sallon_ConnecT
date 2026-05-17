'use client';

import { useEffect, useState } from 'react';
import { useProfiles } from '@/hooks/useProfiles';
import { ProfileSafetyNotice } from './ProfileSafetyNotice';
import { ProfileCard } from './ProfileCard';
import { ProfileEditor } from './ProfileEditor';
import { ProfilePermissions } from './ProfilePermissions';
import { ProfileAudit } from './ProfileAudit';
import type { UserProfile } from '@/lib/types';

export function ProfilesPanel() {
  const {
    profiles,
    activeProfile,
    profilesLoading,
    profilesError,
    auditEntries,
    auditLoading,
    loadProfiles,
    loadActiveProfile,
    createProfile,
    updateProfile,
    deleteProfile,
    activateProfile,
    loadProfileAudit,
    clearProfileAudit,
  } = useProfiles();

  const [showEditor, setShowEditor] = useState(false);
  const [editTarget, setEditTarget] = useState<UserProfile | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    void loadProfiles();
    void loadActiveProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canManage = activeProfile?.permissions?.manageProfiles === true;

  const handleActivate = async (id: string) => {
    await activateProfile(id);
    await loadProfiles();
    await loadActiveProfile();
  };

  const handleEdit = (profile: UserProfile) => {
    setEditTarget(profile);
    setShowEditor(true);
  };

  const handleCreate = () => {
    setEditTarget(null);
    setShowEditor(true);
  };

  const handleSave = async (data: Partial<UserProfile>) => {
    if (editTarget?.id) {
      await updateProfile(editTarget.id, data);
    } else {
      await createProfile(data);
    }
    setShowEditor(false);
    setEditTarget(null);
    await loadProfiles();
  };

  const handleDelete = async (id: string) => {
    await deleteProfile(id);
    await loadProfiles();
  };

  return (
    <div className="space-y-5">
      <ProfileSafetyNotice />

      {profilesError && (
        <p className="text-xs text-red-400">{profilesError}</p>
      )}

      {/* Active profile summary */}
      {activeProfile && (
        <div className="rounded-lg border border-blue-800/40 bg-blue-950/10 p-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Profil actif</p>
              <p className="font-semibold text-slate-100">{activeProfile.name}</p>
              <p className="text-xs text-slate-500 capitalize">{activeProfile.type}</p>
            </div>
            <div className="text-xs space-y-0.5 text-right">
              {activeProfile.safety?.readOnlyMode && (
                <p className="text-yellow-400">Mode lecture seule</p>
              )}
              {activeProfile.safety?.hideSensitivePanels && (
                <p className="text-slate-500">Panneaux sensibles masqués</p>
              )}
              {activeProfile.preferences?.tvModeDefault && (
                <p className="text-blue-400">Mode TV activé</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Profils locaux</h4>
          <div className="flex gap-2">
            <button
              onClick={() => { void loadProfiles(); void loadActiveProfile(); }}
              disabled={profilesLoading}
              className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              {profilesLoading ? 'Chargement…' : 'Actualiser'}
            </button>
            {canManage && (
              <button
                onClick={handleCreate}
                className="px-3 py-1 text-xs bg-blue-700 hover:bg-blue-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                + Nouveau profil
              </button>
            )}
          </div>
        </div>

        {showEditor && (
          <div className="mb-4">
            <ProfileEditor
              profile={editTarget ?? undefined}
              onSave={handleSave}
              onCancel={() => { setShowEditor(false); setEditTarget(null); }}
              loading={profilesLoading}
            />
          </div>
        )}

        {profiles.length === 0 && !profilesLoading ? (
          <p className="text-sm text-slate-500 text-center py-6">Aucun profil. Chargement…</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {profiles.map(p => (
              <ProfileCard
                key={p.id ?? p.name}
                profile={p}
                isActive={activeProfile?.id === p.id}
                canManage={canManage}
                onActivate={() => p.id && void handleActivate(p.id)}
                onEdit={() => handleEdit(p)}
                onDelete={() => p.id && void handleDelete(p.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Permissions for selected or active */}
      {(selectedProfile ?? activeProfile) && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Permissions</h4>
            {profiles.length > 1 && (
              <select
                value={selectedProfile?.id ?? activeProfile?.id ?? ''}
                onChange={e => setSelectedProfile(profiles.find(p => p.id === e.target.value) ?? null)}
                className="ml-auto text-xs bg-gray-900 border border-gray-600 text-gray-300 rounded px-2 py-0.5 focus:outline-none"
                aria-label="Sélectionner profil pour permissions"
              >
                {profiles.map(p => (
                  <option key={p.id} value={p.id ?? ''}>{p.name}</option>
                ))}
              </select>
            )}
          </div>
          <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4">
            <ProfilePermissions profile={selectedProfile ?? activeProfile!} />
          </div>
        </div>
      )}

      {/* Audit */}
      <div>
        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-2">Audit profils</h4>
        <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4">
          <ProfileAudit
            entries={auditEntries}
            loading={auditLoading}
            onLoad={() => void loadProfileAudit()}
            onClear={() => void clearProfileAudit()}
            canClear={canManage}
          />
        </div>
      </div>
    </div>
  );
}

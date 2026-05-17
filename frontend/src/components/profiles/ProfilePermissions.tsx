'use client';

import type { UserProfile } from '@/lib/types';

interface ProfilePermissionsProps {
  profile: UserProfile;
}

const PERM_LABELS: Array<{ key: keyof UserProfile['permissions']; label: string; sensitive?: boolean }> = [
  { key: 'viewDevices', label: 'Voir appareils' },
  { key: 'viewMedia', label: 'Voir médias' },
  { key: 'viewNotifications', label: 'Voir notifications' },
  { key: 'viewScheduler', label: 'Voir scheduler' },
  { key: 'viewObservability', label: 'Voir observabilité' },
  { key: 'runSafeDiagnostics', label: 'Diagnostics sûrs' },
  { key: 'runSchedulerManual', label: 'Lancer scheduler manuellement', sensitive: true },
  { key: 'manageProfiles', label: 'Gérer profils', sensitive: true },
  { key: 'executeSmartThingsScenes', label: 'Scènes SmartThings', sensitive: true },
  { key: 'executeTvCommands', label: 'Commandes TV', sensitive: true },
  { key: 'startStreaming', label: 'Streaming', sensitive: true },
  { key: 'clearAudits', label: 'Effacer audits', sensitive: true },
];

export function ProfilePermissions({ profile }: ProfilePermissionsProps) {
  const perms = profile.permissions;
  const safety = profile.safety;

  return (
    <div className="space-y-3">
      {safety.readOnlyMode && (
        <div className="rounded-md border border-yellow-800/40 bg-yellow-950/20 px-3 py-2 text-xs text-yellow-300">
          Mode lecture seule activ&eacute; &mdash; aucune action d&apos;&eacute;criture permise.
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {PERM_LABELS.map(({ key, label, sensitive }) => {
          const allowed = perms[key];
          return (
            <div
              key={key}
              className={`flex items-center gap-1.5 rounded px-2 py-1 text-xs ${allowed ? 'bg-green-950/20 text-green-300' : 'bg-gray-800/40 text-gray-500'}`}
            >
              <span>{allowed ? '✓' : '✗'}</span>
              <span>{label}</span>
              {sensitive && allowed && <span className="text-yellow-500 text-[9px]">⚠</span>}
            </div>
          );
        })}
      </div>

      <div className="text-xs text-slate-600">
        Les garde-fous backend restent actifs indépendamment des permissions de profil.
      </div>
    </div>
  );
}

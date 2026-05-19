'use client';

import type { HelpTopic } from '@/lib/types';

const TOPICS: HelpTopic[] = [
  { id: 'install', title: 'Installation', description: 'Prérequis, installation guidée Windows, wizard de premier lancement.', category: 'installation', tags: ['installation', 'all'] },
  { id: 'start-stop', title: 'Démarrage & Arrêt', description: 'Scripts de lancement, vérification statut, arrêt propre.', category: 'lancement', tags: ['lancement', 'all'] },
  { id: 'dashboard', title: 'Dashboard', description: 'Navigation entre les 10 sections : Hub, Appareils, Médias, Notifications, etc.', category: 'all', tags: ['all'] },
  { id: 'tv-mode', title: 'Mode TV', description: 'Affichage plein écran, raccourcis clavier T / F, profil TV.', category: 'tv', tags: ['tv', 'all'] },
  { id: 'voice', title: 'Assistant vocal', description: 'Commandes vocales locales, fallback texte, Web Speech API.', category: 'all', tags: ['all'] },
  { id: 'pwa', title: 'PWA', description: 'Installer depuis Chrome ou Edge, fonctionnement offline limité.', category: 'all', tags: ['all'] },
  { id: 'profils', title: 'Profils', description: 'Principal, Famille, Invité, TV, Diagnostic — permissions locales.', category: 'securite', tags: ['securite', 'all'] },
  { id: 'backup', title: 'Sauvegarde', description: 'Créer, vérifier, dry-run et restaurer un backup local avec rollback.', category: 'backup', tags: ['backup', 'securite', 'all'] },
  { id: 'observabilite', title: 'Observabilité', description: 'Health backend, snapshots, graphes, exports non sensibles.', category: 'sante', tags: ['sante', 'all'] },
  { id: 'scheduler', title: 'Scheduler', description: 'Tâches locales sûres, allowlist, aucune action sensible automatique.', category: 'securite', tags: ['securite', 'all'] },
  { id: 'notifications', title: 'Notifications', description: 'Centre local, niveaux info/succès/warning/erreur/sécurité, pas de cloud.', category: 'all', tags: ['all'] },
  { id: 'reseau', title: 'Réseau local', description: 'DLNA, ADB, SmartThings opt-in, découverte passive.', category: 'reseau', tags: ['reseau', 'all'] },
  { id: 'repair', title: 'Réparation', description: 'Réparer dossiers, raccourcis et build sans supprimer les données.', category: 'installation', tags: ['installation', 'all'] },
  { id: 'release', title: 'Release', description: 'Preflight, check, packaging ZIP portable, aucun secret dans Git.', category: 'release', tags: ['release', 'securite', 'all'] },
];

interface HelpTopicsProps {
  query: string;
}

export function HelpTopics({ query }: HelpTopicsProps) {
  const q = query.toLowerCase();
  const filtered = q
    ? TOPICS.filter((t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
    : TOPICS;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sujets</p>
      {filtered.length === 0 && <p className="text-xs text-slate-500">Aucun sujet pour &quot;{query}&quot;.</p>}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {filtered.map((topic) => (
          <div key={topic.id} className="rounded-xl border border-white/8 bg-white/3 p-3 hover:border-sky-400/20 hover:bg-white/5">
            <p className="mb-0.5 text-xs font-semibold text-slate-200">{topic.title}</p>
            <p className="text-[11px] text-slate-500">{topic.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

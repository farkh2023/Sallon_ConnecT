'use client';

import { useState } from 'react';
import { isSafeHelpCommand } from '@/lib/helpSafety';
import type { HelpLab } from '@/lib/types';

const LABS: HelpLab[] = [
  { id: 1, title: 'Installer Sallon-ConnecT', objective: 'Installer les dépendances et préparer le projet.', command: 'scripts\\windows\\install\\install-sallon-connect.bat', expected: 'Backend et frontend prêts, dossiers créés.', category: 'installation', level: 'debutant' },
  { id: 2, title: 'Lancer le dashboard', objective: 'Démarrer les services et ouvrir le dashboard.', command: 'scripts\\windows\\start-sallon-connect.bat', expected: 'Dashboard accessible sur http://localhost:3001', category: 'lancement', level: 'debutant' },
  { id: 3, title: 'Vérifier la santé du système', objective: 'Contrôler que le backend répond correctement.', command: 'npm run health', expected: 'status: ok', category: 'sante', level: 'debutant' },
  { id: 4, title: 'Configurer la Box SFR', objective: 'Ajouter DEVICE_BOX_SFR_HOST dans .env.', command: 'DEVICE_BOX_SFR_HOST=192.168.1.1 (dans .env)', expected: 'Box SFR affichée En ligne.', category: 'reseau', level: 'avance' },
  { id: 5, title: 'Tester le réseau local', objective: 'Identifier les appareils visibles sur le réseau.', command: 'arp -a', expected: 'Liste des appareils ARP visible.', category: 'reseau', level: 'reseau' },
  { id: 6, title: 'Activer DLNA', objective: 'Configurer et tester la découverte DLNA locale.', command: 'Invoke-RestMethod -Method POST http://localhost:3000/api/dlna/discover', expected: 'status: ready ou no_device — pas disabled.', category: 'reseau', level: 'reseau' },
  { id: 7, title: 'Utiliser le Mode TV', objective: 'Passer en interface grand écran.', command: 'Touche T ou bouton Mode TV', expected: 'Interface lisible sur grand écran.', category: 'tv', level: 'debutant' },
  { id: 8, title: 'Utiliser l\'assistant vocal', objective: 'Tester des commandes vocales sûres.', command: '"ouvre les appareils" · "statut du système"', expected: 'Navigation sans action sensible.', category: 'all', level: 'avance' },
  { id: 9, title: 'Créer une sauvegarde locale', objective: 'Créer un backup sûr avec manifest SHA256.', command: 'Invoke-RestMethod -Method POST http://localhost:3000/api/backup/create', expected: 'Backup ZIP local avec manifest.', category: 'backup', level: 'securite' },
  { id: 10, title: 'Vérifier une sauvegarde', objective: 'Contrôler checksum et manifest du backup.', command: 'Invoke-RestMethod http://localhost:3000/api/backup/backups', expected: 'Backup validé — intégrité SHA256 confirmée.', category: 'backup', level: 'securite' },
  { id: 11, title: 'Créer un snapshot d\'observabilité', objective: 'Créer un snapshot et l\'afficher dans les graphes.', command: 'Invoke-RestMethod -Method POST http://localhost:3000/api/observability/snapshots', expected: 'Snapshot visible dans les graphes temporels.', category: 'sante', level: 'avance' },
  { id: 12, title: 'Préparer une release propre', objective: 'Vérifier que le projet est publiable sur GitHub.', command: 'npm run check', expected: '0 erreur — projet publiable.', category: 'release', level: 'securite' },
];

const LEVEL_COLORS: Record<string, string> = {
  debutant: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  avance: 'border-blue-400/30 bg-blue-400/10 text-blue-300',
  securite: 'border-rose-400/30 bg-rose-400/10 text-rose-300',
  reseau: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
};
const LEVEL_LABELS: Record<string, string> = {
  debutant: 'Débutant', avance: 'Avancé', securite: 'Sécurité', reseau: 'Réseau',
};

function CopyCmd({ cmd }: { cmd: string }) {
  const [copied, setCopied] = useState(false);
  if (!isSafeHelpCommand(cmd)) return null;
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(cmd); } catch {
      const ta = document.createElement('textarea'); ta.value = cmd;
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button type="button" onClick={handleCopy} aria-label={`Copier : ${cmd}`}
      className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium transition ${copied ? 'border-emerald-400/40 text-emerald-300' : 'border-white/10 text-slate-500 hover:text-sky-300'}`}>
      {copied ? '✓' : 'Copier'}
    </button>
  );
}

interface HelpPracticalLabsProps { query: string; activeCategory: string; }

export function HelpPracticalLabs({ query, activeCategory }: HelpPracticalLabsProps) {
  const q = query.toLowerCase();
  const filtered = LABS
    .filter((l) => activeCategory === 'all' || l.category === activeCategory || l.category === 'all')
    .filter((l) => !q || l.title.toLowerCase().includes(q) || l.objective.toLowerCase().includes(q));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Travaux pratiques guidés</p>
        <a href="/manuel#travaux-pratiques" className="text-[11px] text-sky-400 hover:text-sky-300">
          Voir dans le manuel ↗
        </a>
      </div>
      {filtered.length === 0 && <p className="text-xs text-slate-500">Aucun TP pour &quot;{query}&quot;.</p>}
      <div className="grid grid-cols-1 gap-2">
        {filtered.map((lab) => (
          <div key={lab.id} className="rounded-xl border border-white/8 bg-white/3 p-3">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">{lab.id}</span>
                <span className="text-xs font-semibold text-slate-200">{lab.title}</span>
              </div>
              <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium ${LEVEL_COLORS[lab.level]}`}>
                {LEVEL_LABELS[lab.level]}
              </span>
            </div>
            <p className="mb-2 text-[11px] text-slate-400">{lab.objective}</p>
            <div className="mb-1.5 flex items-center justify-between gap-2 rounded-lg bg-black/30 px-2.5 py-1.5">
              <code className="min-w-0 truncate font-mono text-[11px] text-slate-300">{lab.command}</code>
              <CopyCmd cmd={lab.command} />
            </div>
            <p className="text-[11px] text-emerald-400/80">✓ {lab.expected}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

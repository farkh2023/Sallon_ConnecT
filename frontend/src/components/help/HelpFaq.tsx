'use client';

import { useState } from 'react';
import type { HelpFaqItem } from '@/lib/types';

const FAQ_ITEMS: HelpFaqItem[] = [
  { id: 'cloud', question: 'Sallon-ConnecT utilise-t-il le cloud ?', answer: 'Non. Le projet est 100% local-first. Dashboard et backend tournent sur votre machine. Les intégrations externes sont optionnelles.', tags: ['securite', 'all'] },
  { id: 'data', question: 'Où sont stockées les données ?', answer: 'data/ → données versionnées · runtime/ → états locaux · logs/ → rapports · backups/ → sauvegardes. Les dossiers sensibles sont ignorés par Git.', tags: ['securite', 'backup', 'all'] },
  { id: 'tv-offline', question: 'Pourquoi ma TV est hors ligne ?', answer: 'Vérifiez que SmartThings est activé (SMARTTHINGS_TOKEN dans .env) et que la TV est sur le même réseau. SmartThings est opt-in — désactivé par défaut.', tags: ['tv', 'reseau', 'all'] },
  { id: 'dlna', question: 'Pourquoi DLNA ne trouve rien ?', answer: 'Vérifiez DLNA_ENABLED=true dans .env et que les appareils sont sur le même réseau local. Redémarrez le backend si nécessaire.', tags: ['reseau', 'all'] },
  { id: 'tv-mode', question: 'Comment lancer le mode TV ?', answer: 'Cliquer Mode TV dans la barre du haut, ou appuyer sur la touche T. Plein écran avec F.', tags: ['tv', 'all'] },
  { id: 'backup', question: 'Comment sauvegarder ?', answer: 'Ouvrir la section Sauvegarde du dashboard et lancer une création. Le backup ZIP est stocké dans backups/ avec un manifest SHA256.', tags: ['backup', 'securite', 'all'] },
  { id: 'restore', question: 'Comment restaurer ?', answer: 'Lancer d\'abord un dry-run depuis la section Sauvegarde, vérifier le résultat, puis confirmer explicitement la restauration.', tags: ['backup', 'securite', 'all'] },
  { id: 'stop', question: 'Comment arrêter proprement ?', answer: 'Utiliser scripts\\windows\\stop-sallon-connect.bat avant de fermer Windows ou de changer de configuration.', tags: ['lancement', 'all'] },
  { id: 'github', question: 'Comment publier sans secrets ?', answer: 'Lancer npm run check puis powershell -ExecutionPolicy Bypass -File scripts\\release\\preflight-github.ps1. Vérifier 0 erreur avant de committer.', tags: ['release', 'securite', 'all'] },
];

interface HelpFaqProps {
  query: string;
  activeCategory: string;
}

export function HelpFaq({ query, activeCategory }: HelpFaqProps) {
  const [open, setOpen] = useState<string | null>(null);
  const q = query.toLowerCase();
  const filtered = FAQ_ITEMS
    .filter((item) => activeCategory === 'all' || item.tags.includes(activeCategory))
    .filter((item) => !q || item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q));

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">FAQ</p>
      {filtered.length === 0 && (
        <p className="text-xs text-slate-500">Aucune question ne correspond à &quot;{query}&quot;.</p>
      )}
      {filtered.map((item) => (
        <div key={item.id} className="overflow-hidden rounded-xl border border-white/8">
          <button
            type="button"
            aria-expanded={open === item.id}
            onClick={() => setOpen(open === item.id ? null : item.id)}
            className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-xs font-medium text-slate-200 transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
          >
            <span>{item.question}</span>
            <span className={`text-slate-500 transition-transform duration-200 ${open === item.id ? 'rotate-180' : ''}`}>▾</span>
          </button>
          {open === item.id && (
            <div className="border-t border-white/5 bg-white/3 px-3 py-2.5 text-xs text-slate-400">
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { isSafeHelpCommand } from '@/lib/helpSafety';
import type { HelpTroubleshootingItem } from '@/lib/types';

const ITEMS: HelpTroubleshootingItem[] = [
  { id: 'port3000', problem: 'Port 3000 déjà utilisé (EADDRINUSE)', solution: 'Arrêter l\'ancien processus.', command: 'scripts\\windows\\stop-sallon-connect.bat', tags: ['lancement', 'all'] },
  { id: 'port3001', problem: 'Port 3001 déjà utilisé', solution: 'Relancer les services.', command: 'scripts\\windows\\stop-sallon-connect.bat', tags: ['lancement', 'all'] },
  { id: 'dlna-disabled', problem: 'DLNA disabled', solution: 'Activer DLNA_ENABLED=true dans .env et redémarrer le backend.', tags: ['reseau', 'all'] },
  { id: 'dlna-no-device', problem: 'DLNA no_device', solution: 'Vérifier que les appareils sont sur le même réseau. Relancer la découverte.', command: 'Invoke-RestMethod -Method POST http://localhost:3000/api/dlna/discover', tags: ['reseau', 'all'] },
  { id: 'backend-off', problem: 'Backend indisponible', solution: 'Redémarrer le backend.', command: 'npm run dev:backend', tags: ['lancement', 'sante', 'all'] },
  { id: 'frontend-off', problem: 'Frontend ne s\'ouvre pas', solution: 'Vérifier http://localhost:3001, relancer si nécessaire.', command: 'npm run dev:frontend', tags: ['lancement', 'all'] },
  { id: 'pwa-cache', problem: 'PWA ancienne version (cache)', solution: 'Fermer tous les onglets, vider le cache du site dans le navigateur, relancer le frontend.', tags: ['all'] },
  { id: 'ps-blocked', problem: 'PowerShell bloque les scripts', solution: 'Utiliser le flag ExecutionPolicy Bypass uniquement pour les scripts du projet vérifiés.', command: 'powershell -ExecutionPolicy Bypass -File scripts\\windows\\status-sallon-connect.ps1', tags: ['installation', 'all'] },
  { id: 'node-old', problem: 'Node version trop ancienne', solution: 'Installer Node.js 22.13 ou plus récent, fermer et rouvrir le terminal.', tags: ['installation', 'all'] },
  { id: 'preflight', problem: 'Git preflight warning', solution: 'Lire le rapport dans logs/, retirer les fichiers interdits, relancer.', command: 'powershell -ExecutionPolicy Bypass -File scripts\\release\\preflight-github.ps1', tags: ['release', 'securite', 'all'] },
];

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
      className={`rounded border px-1.5 py-0.5 text-[10px] transition ${copied ? 'border-emerald-400/40 text-emerald-300' : 'border-white/10 text-slate-500 hover:text-sky-300'}`}>
      {copied ? '✓' : 'Copier'}
    </button>
  );
}

interface HelpTroubleshootingProps { query: string; }

export function HelpTroubleshooting({ query }: HelpTroubleshootingProps) {
  const [open, setOpen] = useState<string | null>(null);
  const q = query.toLowerCase();
  const filtered = q
    ? ITEMS.filter((item) => item.problem.toLowerCase().includes(q) || item.solution.toLowerCase().includes(q))
    : ITEMS;

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Dépannage rapide</p>
      {filtered.length === 0 && <p className="text-xs text-slate-500">Aucun résultat pour &quot;{query}&quot;.</p>}
      {filtered.map((item) => (
        <div key={item.id} className="overflow-hidden rounded-xl border border-white/8">
          <button type="button" aria-expanded={open === item.id}
            onClick={() => setOpen(open === item.id ? null : item.id)}
            className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-xs font-medium text-amber-300/90 transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400">
            <span>⚠ {item.problem}</span>
            <span className={`text-slate-500 transition-transform duration-200 ${open === item.id ? 'rotate-180' : ''}`}>▾</span>
          </button>
          {open === item.id && (
            <div className="border-t border-white/5 bg-white/3 px-3 py-2.5 space-y-2">
              <p className="text-xs text-slate-400">{item.solution}</p>
              {item.command && (
                <div className="flex items-center justify-between gap-2 rounded-lg bg-black/30 px-2.5 py-1.5">
                  <code className="min-w-0 truncate font-mono text-[11px] text-slate-300">{item.command}</code>
                  <CopyCmd cmd={item.command} />
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

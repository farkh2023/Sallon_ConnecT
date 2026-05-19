'use client';

import { useState } from 'react';
import { isSafeHelpCommand } from '@/lib/helpSafety';

const STEPS = [
  { label: 'Installer', command: 'scripts\\windows\\install\\install-sallon-connect.bat', result: 'Dépendances installées, dossiers créés' },
  { label: 'Lancer', command: 'scripts\\windows\\start-sallon-connect.bat', result: 'Backend :3000 · Frontend :3001' },
  { label: 'Ouvrir le dashboard', command: 'scripts\\windows\\open-dashboard.bat', result: 'Navigateur ouvert sur http://localhost:3001' },
  { label: 'Vérifier la santé', command: 'npm run health', result: 'status: ok' },
  { label: 'Arrêter proprement', command: 'scripts\\windows\\stop-sallon-connect.bat', result: 'Services arrêtés proprement' },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const safe = isSafeHelpCommand(text);

  if (!safe) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copier : ${text}`}
      className={`rounded border px-1.5 py-0.5 text-[10px] font-medium transition ${
        copied
          ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300'
          : 'border-white/10 text-slate-500 hover:border-sky-400/30 hover:text-sky-300'
      }`}
    >
      {copied ? '✓ Copié' : 'Copier'}
    </button>
  );
}

export function HelpQuickStart() {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Démarrage rapide</p>
      {STEPS.map((step, i) => (
        <div key={step.label} className="rounded-xl border border-white/8 bg-white/3 p-3">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
              {i + 1}
            </span>
            <span className="text-xs font-medium text-slate-200">{step.label}</span>
          </div>
          <div className="mb-1.5 flex items-center justify-between gap-2 rounded-lg bg-black/30 px-2.5 py-1.5">
            <code className="min-w-0 truncate font-mono text-[11px] text-slate-300">{step.command}</code>
            <CopyButton text={step.command} />
          </div>
          <p className="text-[11px] text-emerald-400/80">✓ {step.result}</p>
        </div>
      ))}
    </div>
  );
}

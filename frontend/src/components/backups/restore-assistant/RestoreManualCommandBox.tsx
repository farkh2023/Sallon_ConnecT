'use client';

import { useState } from 'react';

interface Props {
  command: string | null;
}

export function RestoreManualCommandBox({ command }: Props) {
  const [copied, setCopied] = useState(false);

  if (!command) return null;

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(command); } catch {
      const ta = document.createElement('textarea');
      ta.value = command;
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-emerald-400/20 bg-black/40 p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs text-slate-500">Commande PowerShell a executer manuellement :</p>
        <button
          type="button"
          onClick={handleCopy}
          className={`rounded border px-2 py-1 text-[10px] font-medium transition ${
            copied
              ? 'border-emerald-400/40 text-emerald-300'
              : 'border-white/10 text-slate-400 hover:border-sky-400/30 hover:text-sky-300'
          }`}
        >
          {copied ? '✓ Copie' : 'Copier'}
        </button>
      </div>
      <code className="block break-all text-sm text-emerald-300">{command}</code>
      <p className="mt-3 text-xs text-amber-300">
        Ne pas executer depuis le dashboard — ouvrir PowerShell en tant qu&apos;administrateur.
      </p>
    </div>
  );
}

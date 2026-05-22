'use client';

import { useState } from 'react';
import { isSafeHelpCommand } from '@/lib/helpSafety';
import type { HelpCommand } from '@/lib/types';

const COMMANDS: HelpCommand[] = [
  // Installation
  { id: 'install', label: 'Installation guidée', command: 'scripts\\windows\\install\\install-sallon-connect.bat', category: 'installation' },
  { id: 'repair', label: 'Réparation', command: 'scripts\\windows\\install\\repair-sallon-connect.bat', category: 'installation' },
  { id: 'check-prereqs', label: 'Vérifier prérequis', command: 'powershell -ExecutionPolicy Bypass -File scripts\\windows\\install\\check-prerequisites.ps1', category: 'installation' },
  // Lancement
  { id: 'start', label: 'Démarrer', command: 'scripts\\windows\\start-sallon-connect.bat', category: 'lancement' },
  { id: 'stop', label: 'Arrêter', command: 'scripts\\windows\\stop-sallon-connect.bat', category: 'lancement' },
  { id: 'status', label: 'Statut', command: 'scripts\\windows\\status-sallon-connect.bat', category: 'lancement' },
  { id: 'open', label: 'Ouvrir dashboard', command: 'scripts\\windows\\open-dashboard.bat', category: 'lancement' },
  // Santé
  { id: 'health', label: 'Health check npm', command: 'npm run health', category: 'sante' },
  { id: 'health-api', label: 'Health API', command: 'Invoke-RestMethod http://localhost:3000/api/health', category: 'sante' },
  // Tests
  { id: 'check', label: 'Check complet', command: 'npm run check', category: 'tests' },
  { id: 'test-backend', label: 'Tests backend', command: 'npm run test:backend', category: 'tests' },
  { id: 'test-frontend', label: 'Tests frontend', command: 'npm run test:frontend', category: 'tests' },
  { id: 'test-windows', label: 'Tests PowerShell', command: 'npm run test:windows', category: 'tests' },
  { id: 'test-packaging', label: 'Tests packaging', command: 'npm run test:packaging', category: 'tests' },
  // Documentation
  { id: 'check-docs', label: 'Vérifier docs', command: 'npm run check:docs', category: 'documentation' },
  { id: 'check-manual', label: 'Vérifier manuel', command: 'npm run check:manual', category: 'documentation' },
  // Release
  { id: 'preflight', label: 'Preflight GitHub', command: 'powershell -ExecutionPolicy Bypass -File scripts\\release\\preflight-github.ps1', category: 'release' },
  { id: 'final-check', label: 'Final release check', command: 'powershell -ExecutionPolicy Bypass -File scripts\\release\\final-release-check.ps1', category: 'release' },
  // Backup Phase 40
  { id: 'backup-quick', label: 'Backup rapide', command: 'powershell -ExecutionPolicy Bypass -File scripts\\windows\\backup\\create-backup.ps1 -Type quick', category: 'backup' },
  { id: 'backup-full', label: 'Backup complet', command: 'powershell -ExecutionPolicy Bypass -File scripts\\windows\\backup\\create-backup.ps1 -Type full', category: 'backup' },
  { id: 'backup-list', label: 'Lister backups', command: 'powershell -ExecutionPolicy Bypass -File scripts\\windows\\backup\\list-backups.ps1', category: 'backup' },
  { id: 'backup-verify', label: 'Verifier tous', command: 'powershell -ExecutionPolicy Bypass -File scripts\\windows\\backup\\verify-backup.ps1 -All', category: 'backup' },
  { id: 'backup-restore', label: 'Restaurer (manuel)', command: 'powershell -ExecutionPolicy Bypass -File scripts\\windows\\backup\\restore-backup.ps1', category: 'backup' },
];

const CATEGORY_LABELS: Record<string, string> = {
  installation: '⚙️ Installation',
  lancement: '▶ Lancement',
  sante: '💚 Santé',
  tests: '🧪 Tests',
  documentation: '📄 Documentation',
  release: '🚀 Release',
  backup: '💾 Sauvegardes',
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
      className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium transition ${copied ? 'border-emerald-400/40 text-emerald-300' : 'border-white/10 text-slate-500 hover:border-sky-400/30 hover:text-sky-300'}`}>
      {copied ? '✓ Copié' : 'Copier'}
    </button>
  );
}

interface HelpCommandsProps { query: string; activeCategory: string; }

export function HelpCommands({ query, activeCategory }: HelpCommandsProps) {
  const q = query.toLowerCase();
  const filtered = COMMANDS
    .filter((c) => activeCategory === 'all' || c.category === activeCategory)
    .filter((c) => !q || c.label.toLowerCase().includes(q) || c.command.toLowerCase().includes(q));

  const grouped = filtered.reduce<Record<string, HelpCommand[]>>((acc, cmd) => {
    const cat = cmd.category as string;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(cmd);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Commandes utiles</p>
      {Object.keys(grouped).length === 0 && (
        <p className="text-xs text-slate-500">Aucune commande pour &quot;{query}&quot;.</p>
      )}
      {Object.entries(grouped).map(([cat, cmds]) => (
        <div key={cat}>
          <p className="mb-1.5 text-[11px] font-semibold text-slate-500">{CATEGORY_LABELS[cat] ?? cat}</p>
          <div className="space-y-1">
            {cmds.map((cmd) => (
              <div key={cmd.id} className="flex items-center justify-between gap-2 rounded-lg border border-white/8 bg-black/20 px-2.5 py-1.5">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-slate-400">{cmd.label}</p>
                  <code className="block truncate font-mono text-[11px] text-slate-300">{cmd.command}</code>
                </div>
                <CopyCmd cmd={cmd.command} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

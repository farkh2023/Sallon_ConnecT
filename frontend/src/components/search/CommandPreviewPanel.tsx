'use client';

import type { SearchCommand, CommandRunResponse } from '@/lib/types';

interface CommandPreviewPanelProps {
  command:  SearchCommand | null;
  onRun:    (id: string) => Promise<CommandRunResponse | null>;
  onClose?: () => void;
}

export function CommandPreviewPanel({ command, onRun, onClose }: CommandPreviewPanelProps) {
  if (!command) return null;

  async function handleRun() {
    const result = await onRun(command!.id);
    if (result?.ok && result.action === 'navigate' && result.target) {
      if (typeof window !== 'undefined') window.location.href = result.target;
    }
    onClose?.();
  }

  return (
    <div style={{ padding: '14px 16px', borderTop: '1px solid #222', background: '#0c0c1a' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontWeight: 600, fontSize: 13, color: '#c0c0ff' }}>{command.title}</span>
        <span style={{ fontSize: 10, background: '#1a1a3f', color: '#6060c0', borderRadius: 4, padding: '2px 6px' }}>
          {command.category}
        </span>
      </div>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>{command.description}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {command.tags.map(t => (
          <span key={t} style={{ fontSize: 10, background: '#1a1a2e', border: '1px solid #333', borderRadius: 3, padding: '1px 5px', color: '#6080a0' }}>
            #{t}
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          onClick={handleRun}
          style={{ padding: '6px 14px', borderRadius: 4, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: 12 }}
        >
          {command.dryRunRequired ? 'Simuler (dry-run)' : 'Executer'}
        </button>
        {command.dryRunRequired && (
          <span style={{ fontSize: 10, color: '#b45309' }}>Simulation uniquement — aucune action reelle</span>
        )}
        <span style={{ fontSize: 10, color: '#4ade80', marginLeft: 'auto' }}>Local uniquement</span>
      </div>
    </div>
  );
}

'use client';

import type { WorkflowNode } from '@/lib/types';

const NODE_COLORS: Record<string, string> = {
  'agent':                  'border-sky-500/40 bg-sky-500/8',
  'rag-search':             'border-violet-500/40 bg-violet-500/8',
  'rag-ask':                'border-violet-500/40 bg-violet-500/8',
  'diagnostic':             'border-amber-500/40 bg-amber-500/8',
  'notification':           'border-emerald-500/40 bg-emerald-500/8',
  'condition':              'border-orange-500/40 bg-orange-500/8',
  'delay':                  'border-slate-500/40 bg-slate-500/8',
  'safe-command-suggestion': 'border-cyan-500/40 bg-cyan-500/8',
  'plugin-tool':            'border-rose-500/40 bg-rose-500/8',
};

const NODE_ICONS: Record<string, string> = {
  'agent':                  '🤖',
  'rag-search':             '🔍',
  'rag-ask':                '💬',
  'diagnostic':             '🩺',
  'notification':           '🔔',
  'condition':              '⚡',
  'delay':                  '⏱',
  'safe-command-suggestion': '💻',
  'plugin-tool':            '🔌',
};

interface WorkflowNodeCardProps {
  node: WorkflowNode;
}

export function WorkflowNodeCard({ node }: WorkflowNodeCardProps) {
  const color = NODE_COLORS[node.type] || 'border-white/10 bg-white/5';
  const icon  = NODE_ICONS[node.type]  || '▸';

  return (
    <div className={`rounded-lg border px-3 py-2 ${color}`}>
      <div className="flex items-center gap-2">
        <span aria-hidden>{icon}</span>
        <div>
          <p className="text-xs font-semibold text-slate-200">{node.label || node.id}</p>
          <p className="text-[10px] text-slate-500">{node.type}</p>
        </div>
      </div>
      {node.dependsOn && node.dependsOn.length > 0 && (
        <p className="mt-1 text-[10px] text-slate-600">
          apres : {node.dependsOn.join(', ')}
        </p>
      )}
    </div>
  );
}

'use client';

import type { WorkflowNode, WorkflowEdge } from '@/lib/types';
import { WorkflowNodeCard } from './WorkflowNodeCard';

interface WorkflowCanvasProps {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export function WorkflowCanvas({ nodes, edges }: WorkflowCanvasProps) {
  if (nodes.length === 0) {
    return <p className="text-xs text-slate-600">Aucun noeud dans ce workflow.</p>;
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {nodes.map(node => (
          <WorkflowNodeCard key={node.id} node={node} />
        ))}
      </div>

      {edges.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {edges.map((e, i) => (
            <span key={i} className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-slate-600">
              {e.from} → {e.to}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

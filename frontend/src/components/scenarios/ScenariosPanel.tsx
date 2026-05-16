'use client';

import { useApi } from '@/hooks/useApi';
import { ScenarioCard } from './ScenarioCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SafetyNotice } from '@/components/ui/SafetyNotice';
import type { Scenario } from '@/lib/types';

interface ScenariosResp { scenarios: Scenario[] }

export function ScenariosPanel() {
  const { data, loading, error } = useApi<ScenariosResp>('/api/scenarios/runtime');

  if (loading) return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white/[0.03] border border-white/[0.07] rounded-xl h-28 animate-pulse" />
      ))}
    </div>
  );

  if (error) return <div className="text-xs text-red-400">{error}</div>;

  const scenarios = data?.scenarios ?? [];

  return (
    <div>
      {scenarios.length === 0
        ? <EmptyState icon="🎭" title="Aucun scénario disponible" />
        : <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {scenarios.map(s => <ScenarioCard key={s.id} scenario={s} />)}
          </div>
      }
      <SafetyNotice>Mode simulated par défaut — aucune action réelle sans activation explicite.</SafetyNotice>
    </div>
  );
}

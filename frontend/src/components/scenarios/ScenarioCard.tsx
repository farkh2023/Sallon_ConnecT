import type { Scenario } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';

const MODE_COLOR: Record<string, 'gray' | 'yellow' | 'blue'> = {
  simulated: 'blue',
  assisted:  'yellow',
  live:      'gray',
};

const ICONS: Record<string, string> = {
  cinema:       '🎬',
  travail:      '💼',
  famille:      '👨‍👩‍👧',
  presentation: '📊',
  veille:       '🌙',
  diagnostic:   '🔬',
};

interface ScenarioCardProps { scenario: Scenario }

export function ScenarioCard({ scenario }: ScenarioCardProps) {
  const icon  = ICONS[scenario.id] ?? '⚙️';
  const color = MODE_COLOR[scenario.mode] ?? 'gray';

  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <Badge color={color}>{scenario.mode}</Badge>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-200">{scenario.name}</p>
        {scenario.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{scenario.description}</p>}
      </div>
      {scenario.stepCount !== undefined && (
        <p className="text-xs text-slate-600">{scenario.stepCount} étape(s)</p>
      )}
    </div>
  );
}

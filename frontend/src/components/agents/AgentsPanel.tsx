import { AgentCard } from './AgentCard';

const AGENTS = [
  { step: 1, name: 'Agent Découverte réseau',   role: 'Cartographie les appareils disponibles',                      icon: '🔍' },
  { step: 2, name: 'Agent Inventaire',          role: 'Organise par type, rôle et priorité',                         icon: '📋' },
  { step: 3, name: 'Agent Affichage TV',        role: 'Prépare l\'interface pour Samsung TV 4K',                     icon: '📺' },
  { step: 4, name: 'Agent Multimédia',          role: 'Indexe les services disponibles',                             icon: '🎵' },
  { step: 5, name: 'Agent Automatisation',      role: 'Configure les scénarios intelligents',                        icon: '⚙️' },
  { step: 6, name: 'Agent Synthèse',            role: 'Fusionne tous les résultats dans le tableau de bord final',   icon: '🧩' },
];

export function AgentsPanel() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {AGENTS.map(a => <AgentCard key={a.step} {...a} />)}
    </div>
  );
}

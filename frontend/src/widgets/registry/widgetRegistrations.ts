/**
 * Enregistrement de tous les widgets système Phase 44 + Phase 45 (IA locale).
 * Importer ce fichier une seule fois au démarrage du dashboard.
 */
import { registerWidget } from './widgetRegistry';
import type { WidgetManifest } from '../core/widgetTypes';

import { SystemHealthWidget  } from '../examples/SystemHealthWidget';
import { NotificationsWidget } from '../examples/NotificationsWidget';
import { PluginsWidget       } from '../examples/PluginsWidget';
import { DiagnosticsWidget   } from '../examples/DiagnosticsWidget';
import { SSEStatusWidget     } from '../examples/SSEStatusWidget';
import { BackupStatusWidget  } from '../examples/BackupStatusWidget';
import { ServiceStatusWidget } from '../examples/ServiceStatusWidget';
import { UpdatesWidget       } from '../examples/UpdatesWidget';
import { LocalAiStatusWidget } from '../examples/LocalAiStatusWidget';
import { AiDiagnosticsWidget } from '../examples/AiDiagnosticsWidget';
import { AiLogSummaryWidget  } from '../examples/AiLogSummaryWidget';
import { RagStatusWidget            } from '../examples/RagStatusWidget';
import { RagAskWidget               } from '../examples/RagAskWidget';
import { RagSourcesWidget           } from '../examples/RagSourcesWidget';
import { AgentsStatusWidget         } from '../examples/AgentsStatusWidget';
import { AgentRunWidget             } from '../examples/AgentRunWidget';
import { AgentRecommendationsWidget } from '../examples/AgentRecommendationsWidget';
import { WorkflowsStatusWidget      } from '../examples/WorkflowsStatusWidget';
import { WorkflowRunWidget          } from '../examples/WorkflowRunWidget';
import { WorkflowTemplatesWidget    } from '../examples/WorkflowTemplatesWidget';
import { MemoryStatusWidget         } from '../examples/MemoryStatusWidget';
import { MemorySearchWidget         } from '../examples/MemorySearchWidget';
import { MemoryRecentWidget         } from '../examples/MemoryRecentWidget';
import { KnowledgeStatusWidget      } from '../examples/KnowledgeStatusWidget';
import { KnowledgeSearchWidget      } from '../examples/KnowledgeSearchWidget';
import { KnowledgeGraphWidget       } from '../examples/KnowledgeGraphWidget';
import { GlobalSearchWidget         } from '../examples/GlobalSearchWidget';
import { CommandCenterWidget        } from '../examples/CommandCenterWidget';
import { RecentSearchesWidget       } from '../examples/RecentSearchesWidget';
import { WorkspaceStatusWidget      } from '../examples/WorkspaceStatusWidget';
import { WorkspaceSwitcherWidget    } from '../examples/WorkspaceSwitcherWidget';
import { WorkspaceSummaryWidget     } from '../examples/WorkspaceSummaryWidget';

const MANIFESTS: WidgetManifest[] = [
  {
    id: 'system-health', name: 'Sante systeme', version: '1.0.0',
    description: "Etat global du backend (status, phase, serveur).",
    component: 'SystemHealthWidget', permissions: [], defaultSize: 'small',
    localOnly: true, category: 'system', refreshable: true,
  },
  {
    id: 'notifications', name: 'Notifications', version: '1.0.0',
    description: 'Compteur notifications locales non lues.',
    component: 'NotificationsWidget', permissions: ['read:notifications'], defaultSize: 'small',
    localOnly: true, category: 'notifications', refreshable: true,
  },
  {
    id: 'plugins', name: 'Plugins', version: '1.0.0',
    description: 'Vue d\'ensemble des plugins installes.',
    component: 'PluginsWidget', permissions: [], defaultSize: 'small',
    localOnly: true, category: 'plugins', refreshable: true,
  },
  {
    id: 'diagnostics', name: 'Diagnostics', version: '1.0.0',
    description: 'Etat du diagnostic avance (memoire, node, statut).',
    component: 'DiagnosticsWidget', permissions: ['read:diagnostics'], defaultSize: 'medium',
    localOnly: true, category: 'system', refreshable: true,
  },
  {
    id: 'sse-status', name: 'Flux SSE', version: '1.0.0',
    description: 'Nombre de clients SSE connectes localement.',
    component: 'SSEStatusWidget', permissions: [], defaultSize: 'small',
    localOnly: true, category: 'network', refreshable: true,
  },
  {
    id: 'backup-status', name: 'Sauvegardes', version: '1.0.0',
    description: 'Compteur et dernier snapshot local.',
    component: 'BackupStatusWidget', permissions: ['read:backups'], defaultSize: 'medium',
    localOnly: true, category: 'backup', refreshable: true,
  },
  {
    id: 'service-status', name: 'Service', version: '1.0.0',
    description: 'Uptime, memoire et statut du scheduler.',
    component: 'ServiceStatusWidget', permissions: ['read:diagnostics'], defaultSize: 'medium',
    localOnly: true, category: 'system', refreshable: true,
  },
  {
    id: 'updates', name: 'Mises a jour', version: '1.0.0',
    description: 'Version actuelle et procedure de mise a jour locale.',
    component: 'UpdatesWidget', permissions: [], defaultSize: 'medium',
    localOnly: true, category: 'updates', refreshable: false,
  },
  {
    id: 'local-ai-status', name: 'IA locale', version: '1.0.0',
    description: 'Statut Ollama et modele IA actif.',
    component: 'LocalAiStatusWidget', permissions: ['ai-read'], defaultSize: 'small',
    localOnly: true, category: 'system', refreshable: true,
  },
  {
    id: 'ai-diagnostics', name: 'Diagnostic IA', version: '1.0.0',
    description: 'Analyse diagnostics systeme par l\'IA locale.',
    component: 'AiDiagnosticsWidget', permissions: ['ai-diagnostics'], defaultSize: 'medium',
    localOnly: true, category: 'system', refreshable: false,
  },
  {
    id: 'ai-log-summary', name: 'Analyse logs IA', version: '1.0.0',
    description: 'Resume et analyse des logs locaux par l\'IA.',
    component: 'AiLogSummaryWidget', permissions: ['ai-read'], defaultSize: 'medium',
    localOnly: true, category: 'system', refreshable: false,
  },
  {
    id: 'rag-status', name: 'RAG statut', version: '1.0.0',
    description: 'Statut de l\'index RAG local (chunks, mode, sources).',
    component: 'RagStatusWidget', permissions: ['ai-read'], defaultSize: 'small',
    localOnly: true, category: 'system', refreshable: true,
  },
  {
    id: 'rag-ask', name: 'RAG question', version: '1.0.0',
    description: 'Posez une question a la documentation locale via RAG.',
    component: 'RagAskWidget', permissions: ['ai-chat'], defaultSize: 'medium',
    localOnly: true, category: 'system', refreshable: false,
  },
  {
    id: 'rag-sources', name: 'RAG sources', version: '1.0.0',
    description: 'Liste des sources documentaires indexees dans le RAG local.',
    component: 'RagSourcesWidget', permissions: ['ai-read'], defaultSize: 'medium',
    localOnly: true, category: 'system', refreshable: true,
  },
  {
    id: 'agents-status', name: 'Agents IA', version: '1.0.0',
    description: 'Statut des agents IA locaux orchestres (nombre actifs, dry-run).',
    component: 'AgentsStatusWidget', permissions: ['ai-read'], defaultSize: 'small',
    localOnly: true, category: 'system', refreshable: true,
  },
  {
    id: 'agent-run', name: 'Agents — tache', version: '1.0.0',
    description: 'Lancer une tache rapide sur les agents IA locaux (dry-run).',
    component: 'AgentRunWidget', permissions: ['ai-chat'], defaultSize: 'medium',
    localOnly: true, category: 'system', refreshable: false,
  },
  {
    id: 'agent-recommendations', name: 'Agents — derniere run', version: '1.0.0',
    description: 'Historique et resultats de la derniere run d\'agents IA locaux.',
    component: 'AgentRecommendationsWidget', permissions: ['ai-read'], defaultSize: 'medium',
    localOnly: true, category: 'system', refreshable: true,
  },
  {
    id: 'workflows-status', name: 'Workflows IA', version: '1.0.0',
    description: 'Nombre de workflows actifs et statut dry-run local.',
    component: 'WorkflowsStatusWidget', permissions: ['ai-read'], defaultSize: 'small',
    localOnly: true, category: 'system', refreshable: true,
  },
  {
    id: 'workflow-run', name: 'Workflows — executer', version: '1.0.0',
    description: 'Lancer un workflow IA local par son ID (dry-run).',
    component: 'WorkflowRunWidget', permissions: ['ai-chat'], defaultSize: 'medium',
    localOnly: true, category: 'system', refreshable: false,
  },
  {
    id: 'workflow-templates', name: 'Workflows — templates', version: '1.0.0',
    description: 'Liste des templates de workflows disponibles localement.',
    component: 'WorkflowTemplatesWidget', permissions: ['ai-read'], defaultSize: 'medium',
    localOnly: true, category: 'system', refreshable: true,
  },
  {
    id: 'memory-status', name: 'Memoire IA', version: '1.0.0',
    description: 'Statut de la memoire persistante IA locale (items, types, activation).',
    component: 'MemoryStatusWidget', permissions: ['ai-memory-read'], defaultSize: 'small',
    localOnly: true, category: 'system', refreshable: true,
  },
  {
    id: 'memory-search', name: 'Memoire — recherche', version: '1.0.0',
    description: 'Recherche lexicale dans la memoire persistante IA locale.',
    component: 'MemorySearchWidget', permissions: ['ai-memory-search'], defaultSize: 'medium',
    localOnly: true, category: 'system', refreshable: false,
  },
  {
    id: 'memory-recent', name: 'Memoire — recente', version: '1.0.0',
    description: 'Affiche les items les plus recents de la memoire IA locale.',
    component: 'MemoryRecentWidget', permissions: ['ai-memory-read'], defaultSize: 'medium',
    localOnly: true, category: 'system', refreshable: true,
  },
  {
    id: 'knowledge-status', name: 'Knowledge — statut', version: '1.0.0',
    description: 'Statut de la base de connaissances locale.',
    component: 'KnowledgeStatusWidget', permissions: [], defaultSize: 'small',
    localOnly: true, category: 'system', refreshable: true,
  },
  {
    id: 'knowledge-search', name: 'Knowledge — recherche', version: '1.0.0',
    description: 'Recherche dans la base de connaissances locale.',
    component: 'KnowledgeSearchWidget', permissions: [], defaultSize: 'medium',
    localOnly: true, category: 'system', refreshable: false,
  },
  {
    id: 'knowledge-graph', name: 'Knowledge — graphe', version: '1.0.0',
    description: 'Vue graphe de la base de connaissances locale.',
    component: 'KnowledgeGraphWidget', permissions: [], defaultSize: 'medium',
    localOnly: true, category: 'system', refreshable: false,
  },
  {
    id: 'global-search', name: 'Recherche globale', version: '1.0.0',
    description: 'Recherche lexicale dans toutes les sources locales.',
    component: 'GlobalSearchWidget', permissions: [], defaultSize: 'medium',
    localOnly: true, category: 'system', refreshable: false,
  },
  {
    id: 'command-center', name: 'Command Center', version: '1.0.0',
    description: 'Acces rapide aux commandes et navigation Ctrl+K.',
    component: 'CommandCenterWidget', permissions: [], defaultSize: 'small',
    localOnly: true, category: 'system', refreshable: false,
  },
  {
    id: 'recent-searches', name: 'Recherches recentes', version: '1.0.0',
    description: 'Historique des recherches locales recentes.',
    component: 'RecentSearchesWidget', permissions: [], defaultSize: 'small',
    localOnly: true, category: 'system', refreshable: true,
  },
  {
    id: 'workspace-status', name: 'Workspace — statut', version: '1.0.0',
    description: 'Workspace courant et nombre total de profils locaux.',
    component: 'WorkspaceStatusWidget', permissions: [], defaultSize: 'small',
    localOnly: true, category: 'system', refreshable: true,
  },
  {
    id: 'workspace-switcher', name: 'Workspace — switcher', version: '1.0.0',
    description: 'Changer de workspace local depuis le dashboard.',
    component: 'WorkspaceSwitcherWidget', permissions: [], defaultSize: 'small',
    localOnly: true, category: 'system', refreshable: false,
  },
  {
    id: 'workspace-summary', name: 'Workspace — resume', version: '1.0.0',
    description: 'Resume du workspace actif : nom, theme, langue, features IA.',
    component: 'WorkspaceSummaryWidget', permissions: [], defaultSize: 'medium',
    localOnly: true, category: 'system', refreshable: true,
  },
];

const COMPONENTS = {
  'system-health':    SystemHealthWidget,
  'notifications':    NotificationsWidget,
  'plugins':          PluginsWidget,
  'diagnostics':      DiagnosticsWidget,
  'sse-status':       SSEStatusWidget,
  'backup-status':    BackupStatusWidget,
  'service-status':   ServiceStatusWidget,
  'updates':          UpdatesWidget,
  'local-ai-status':  LocalAiStatusWidget,
  'ai-diagnostics':   AiDiagnosticsWidget,
  'ai-log-summary':   AiLogSummaryWidget,
  'rag-status':             RagStatusWidget,
  'rag-ask':                RagAskWidget,
  'rag-sources':            RagSourcesWidget,
  'agents-status':          AgentsStatusWidget,
  'agent-run':              AgentRunWidget,
  'agent-recommendations':  AgentRecommendationsWidget,
  'workflows-status':       WorkflowsStatusWidget,
  'workflow-run':           WorkflowRunWidget,
  'workflow-templates':     WorkflowTemplatesWidget,
  'memory-status':          MemoryStatusWidget,
  'memory-search':          MemorySearchWidget,
  'memory-recent':          MemoryRecentWidget,
  'knowledge-status':       KnowledgeStatusWidget,
  'knowledge-search':       KnowledgeSearchWidget,
  'knowledge-graph':        KnowledgeGraphWidget,
  'global-search':          GlobalSearchWidget,
  'command-center':         CommandCenterWidget,
  'recent-searches':        RecentSearchesWidget,
  'workspace-status':       WorkspaceStatusWidget,
  'workspace-switcher':     WorkspaceSwitcherWidget,
  'workspace-summary':      WorkspaceSummaryWidget,
} as const;

MANIFESTS.forEach(manifest => {
  const component = COMPONENTS[manifest.id as keyof typeof COMPONENTS];
  if (component) registerWidget(manifest, component);
});

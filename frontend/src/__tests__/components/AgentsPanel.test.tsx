import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/hooks/useAgents', () => ({
  useAgents: vi.fn(),
}));

import { useAgents } from '@/hooks/useAgents';
import { AgentsPanel } from '@/components/ai/AgentsPanel';
import type { AgentManifest, AgentRunResult } from '@/lib/types';

const AGENT_DIAGNOSTIC: AgentManifest = {
  id: 'diagnostic-agent', name: 'Diagnostic Agent',
  description: 'Analyse diagnostics systeme.',
  model: 'qwen2.5:7b', tools: ['diagnostics.read'], permissions: ['ai-diagnostics'],
  enabled: true, localOnly: true, dryRun: true,
};

const AGENT_SECURITY: AgentManifest = {
  id: 'security-agent', name: 'Security Agent',
  description: 'Analyse risques securite.',
  model: 'qwen2.5:7b', tools: ['plugins.list'], permissions: ['ai-diagnostics'],
  enabled: true, localOnly: true, dryRun: true,
};

const RUN_RESULT: AgentRunResult = {
  ok: true, runId: 'run001', status: 'completed',
  task: 'analyser le systeme',
  agentsUsed: ['diagnostic-agent'],
  steps: [{
    agentId: 'diagnostic-agent', agentName: 'Diagnostic Agent',
    steps: [{ tool: 'diagnostics.read', input: '{}', output: '{"score":85}', ok: true, error: null }],
    output: 'Systeme en bonne sante. Score 85/100.',
    ok: true, error: null, citations: [], rejectedActions: [], dryRun: true,
  }],
  recommendations: [{ agentId: 'diagnostic-agent', agentName: 'Diagnostic Agent', text: 'Systeme OK', dryRun: true }],
  citations: [{ index: 1, source: 'README.md', heading: 'Intro', excerpt: 'Hub local...', score: 0.9 }],
  rejectedActions: [{ tool: 'shell.execute', reason: 'outil_interdit' }],
  safetySummary: { localOnly: true, dryRun: true, noAutoExecution: true, agentsRun: 1, agentsFailed: 0, rejectedTotal: 1 },
  summary: 'Synthese : systeme OK.',
  startedAt: '2026-05-23T12:00:00.000Z', completedAt: '2026-05-23T12:00:10.000Z',
  dryRun: true,
};

function mockHook(overrides: Partial<ReturnType<typeof useAgents>>) {
  (useAgents as ReturnType<typeof vi.fn>).mockReturnValue({
    agents:     [],
    runs:       [],
    runResult:  null,
    loading:    false,
    error:      null,
    loadAgents: vi.fn(),
    loadRuns:   vi.fn(),
    runAgents:  vi.fn().mockResolvedValue(null),
    clearResult: vi.fn(),
    ...overrides,
  });
}

describe('AgentsPanel', () => {
  beforeEach(() => {
    mockHook({});
  });

  it('affiche l\'etat vide quand aucun agent n\'est disponible', () => {
    render(<AgentsPanel />);
    expect(screen.getByText(/aucun agent disponible/i)).toBeDefined();
  });

  it('affiche la liste des agents disponibles', () => {
    mockHook({ agents: [AGENT_DIAGNOSTIC, AGENT_SECURITY] });
    render(<AgentsPanel />);
    expect(screen.getByText('Diagnostic Agent')).toBeDefined();
    expect(screen.getByText('Security Agent')).toBeDefined();
  });

  it('affiche le formulaire de tache quand des agents sont disponibles', () => {
    mockHook({ agents: [AGENT_DIAGNOSTIC] });
    render(<AgentsPanel />);
    expect(screen.getByLabelText(/tache a analyser/i)).toBeDefined();
  });

  it('affiche le badge dry-run actif dans le formulaire', () => {
    mockHook({ agents: [AGENT_DIAGNOSTIC] });
    render(<AgentsPanel />);
    expect(screen.getAllByText(/dry-run actif/i).length).toBeGreaterThan(0);
  });

  it('affiche la timeline d\'execution apres un run reussi', () => {
    mockHook({ agents: [AGENT_DIAGNOSTIC], runResult: RUN_RESULT });
    render(<AgentsPanel />);
    expect(screen.getAllByText('Diagnostic Agent').length).toBeGreaterThan(0);
    expect(screen.getByText(/systeme en bonne sante/i)).toBeDefined();
  });

  it('affiche les recommandations apres un run', () => {
    mockHook({ agents: [AGENT_DIAGNOSTIC], runResult: RUN_RESULT });
    render(<AgentsPanel />);
    expect(screen.getAllByText('Systeme OK').length).toBeGreaterThan(0);
  });

  it('affiche les actions rejetees', () => {
    mockHook({ agents: [AGENT_DIAGNOSTIC], runResult: RUN_RESULT });
    render(<AgentsPanel />);
    expect(screen.getByText('shell.execute')).toBeDefined();
    expect(screen.getByText('outil_interdit')).toBeDefined();
  });

  it('affiche les citations RAG', () => {
    mockHook({ agents: [AGENT_DIAGNOSTIC], runResult: RUN_RESULT });
    render(<AgentsPanel />);
    expect(screen.getByText('README.md')).toBeDefined();
    expect(screen.getByText(/hub local/i)).toBeDefined();
  });

  it('affiche l\'erreur backend', () => {
    mockHook({ error: 'Connexion backend impossible' });
    render(<AgentsPanel />);
    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByText('Connexion backend impossible')).toBeDefined();
  });

  it('le bouton Lancer les agents est desactive si la tache est vide', async () => {
    mockHook({ agents: [AGENT_DIAGNOSTIC] });
    const user = userEvent.setup();
    render(<AgentsPanel />);
    const btn = screen.getByRole('button', { name: /lancer les agents/i });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
    await user.type(screen.getByLabelText(/tache a analyser/i), 'test');
    expect((btn as HTMLButtonElement).disabled).toBe(false);
  });
});

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getWidget } from '@/widgets/registry/widgetRegistry';
import '@/widgets/registry/widgetRegistrations';

vi.mock('@/widgets/core/useWidgetData', () => ({
  useWidgetData: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  apiGet:  vi.fn(),
  apiPost: vi.fn(),
}));

import { useWidgetData } from '@/widgets/core/useWidgetData';
import { AgentsStatusWidget }         from '@/widgets/examples/AgentsStatusWidget';
import { AgentRecommendationsWidget } from '@/widgets/examples/AgentRecommendationsWidget';

function mockWidgetData<T>(overrides: { data?: T; loading?: boolean; error?: string | null; refresh?: () => void }) {
  (useWidgetData as ReturnType<typeof vi.fn>).mockReturnValue({
    data:    null,
    loading: false,
    error:   null,
    refresh: vi.fn(),
    ...overrides,
  });
}

describe('AgentsStatusWidget', () => {
  beforeEach(() => mockWidgetData({ data: null }));

  it('affiche l\'etat vide quand aucun agent n\'est disponible', () => {
    render(<AgentsStatusWidget size="small" />);
    expect(screen.getByText(/aucun agent disponible/i)).toBeDefined();
  });

  it('affiche le nombre d\'agents actifs', () => {
    mockWidgetData({
      data: {
        agents: [
          { id: 'a1', name: 'Diagnostic Agent', enabled: true, localOnly: true },
          { id: 'a2', name: 'Security Agent', enabled: false, localOnly: true },
        ],
        total: 2,
        safety: { localOnly: true },
      },
    });
    render(<AgentsStatusWidget size="small" />);
    expect(screen.getByText('1 / 2 actifs')).toBeDefined();
  });

  it('est localOnly : le widget est enregistre avec localOnly=true', () => {
    const entry = getWidget('agents-status');
    expect(entry?.manifest.localOnly).toBe(true);
  });

  it('badge dry-run est visible en mode medium', () => {
    mockWidgetData({
      data: {
        agents: [{ id: 'a1', name: 'Diagnostic Agent', enabled: true }],
        total: 1,
        safety: {},
      },
    });
    render(<AgentsStatusWidget size="medium" />);
    expect(screen.getByText('dry-run')).toBeDefined();
  });
});

describe('AgentRecommendationsWidget', () => {
  beforeEach(() => mockWidgetData({ data: null }));

  it('affiche l\'etat vide quand aucune run n\'est enregistree', () => {
    mockWidgetData({ data: { runs: [], total: 0 } });
    render(<AgentRecommendationsWidget size="small" />);
    expect(screen.getByText(/aucune run enregistree/i)).toBeDefined();
  });

  it('affiche la tache de la derniere run', () => {
    mockWidgetData({
      data: {
        runs: [{
          runId: 'r001', task: 'analyser le systeme',
          agentsUsed: ['diagnostic-agent'],
          status: 'completed',
          startedAt: '2026-05-23T12:00:00.000Z',
          completedAt: '2026-05-23T12:00:10.000Z',
        }],
        total: 1,
      },
    });
    render(<AgentRecommendationsWidget size="small" />);
    expect(screen.getByText('analyser le systeme')).toBeDefined();
  });

  it('est enregistre avec les bonnes permissions', () => {
    const entry = getWidget('agent-recommendations');
    expect(entry?.manifest.permissions).toContain('ai-read');
    expect(entry?.manifest.localOnly).toBe(true);
  });

  it('affiche les agents utilises en mode medium', () => {
    mockWidgetData({
      data: {
        runs: [{
          runId: 'r002', task: 'securite',
          agentsUsed: ['security-agent', 'backup-agent'],
          status: 'completed',
          startedAt: '2026-05-23T12:00:00.000Z',
          completedAt: '2026-05-23T12:00:10.000Z',
        }],
        total: 1,
      },
    });
    render(<AgentRecommendationsWidget size="medium" />);
    expect(screen.getByText(/security-agent.*backup-agent/i)).toBeDefined();
  });
});

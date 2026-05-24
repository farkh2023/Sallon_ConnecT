import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/widgets/core/useWidgetData', () => ({
  useWidgetData: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  apiGet:  vi.fn(),
  apiPost: vi.fn().mockResolvedValue({ status: 'completed', dryRun: true, nodeResults: [], rejectedActions: [] }),
}));

import { useWidgetData } from '@/widgets/core/useWidgetData';
import { WorkflowsStatusWidget }   from '@/widgets/examples/WorkflowsStatusWidget';
import { WorkflowTemplatesWidget } from '@/widgets/examples/WorkflowTemplatesWidget';
import { WorkflowRunWidget }       from '@/widgets/examples/WorkflowRunWidget';
import type { WorkflowsListResponse, WorkflowTemplateSummary } from '@/lib/types';

function mockWidgetData<T>(overrides: { data?: T; loading?: boolean; error?: string | null; refresh?: () => void }) {
  (useWidgetData as ReturnType<typeof vi.fn>).mockReturnValue({
    data:    null,
    loading: false,
    error:   null,
    refresh: vi.fn(),
    ...overrides,
  });
}

// ── WorkflowsStatusWidget ────────────────────────────────────────────────────

describe('WorkflowsStatusWidget', () => {
  beforeEach(() => mockWidgetData({ data: null }));

  it('affiche l\'en-tete "Workflows IA"', () => {
    render(<WorkflowsStatusWidget size="small" />);
    expect(screen.getByText('Workflows IA')).toBeTruthy();
  });

  it('affiche "Chargement..." pendant le chargement', () => {
    mockWidgetData({ loading: true });
    render(<WorkflowsStatusWidget size="small" />);
    expect(screen.getByText('Chargement...')).toBeTruthy();
  });

  it('affiche une erreur', () => {
    mockWidgetData({ error: 'Erreur workflows' });
    render(<WorkflowsStatusWidget size="small" />);
    expect(screen.getByRole('alert')).toBeTruthy();
  });

  it('affiche le compte actifs/total', () => {
    const data: WorkflowsListResponse = {
      workflows: [
        { id: 'wf1', name: 'WF1', description: '', enabled: true,  nodeCount: 2, localOnly: true, dryRun: true },
        { id: 'wf2', name: 'WF2', description: '', enabled: false, nodeCount: 1, localOnly: true, dryRun: true },
      ],
      total: 2,
      safety: { localOnly: true, dryRunByDefault: true, noAutoExecution: true, allowedNodeTypes: [], forbiddenNodeTypes: [], maxNodes: 25, maxSteps: 30 },
    };
    mockWidgetData({ data });
    render(<WorkflowsStatusWidget size="small" />);
    expect(screen.getByText('1 / 2 actifs')).toBeTruthy();
  });

  it('affiche le badge dry-run', () => {
    const data: WorkflowsListResponse = {
      workflows: [{ id: 'wf1', name: 'WF1', description: '', enabled: true, nodeCount: 2, localOnly: true, dryRun: true }],
      total: 1,
      safety: { localOnly: true, dryRunByDefault: true, noAutoExecution: true, allowedNodeTypes: [], forbiddenNodeTypes: [], maxNodes: 25, maxSteps: 30 },
    };
    mockWidgetData({ data });
    render(<WorkflowsStatusWidget size="small" />);
    expect(screen.getByText('dry-run')).toBeTruthy();
  });
});

// ── WorkflowTemplatesWidget ──────────────────────────────────────────────────

describe('WorkflowTemplatesWidget', () => {
  beforeEach(() => mockWidgetData({ data: null }));

  it('affiche l\'en-tete "Templates workflows"', () => {
    render(<WorkflowTemplatesWidget size="small" />);
    expect(screen.getByText('Templates workflows')).toBeTruthy();
  });

  it('affiche "Chargement..." pendant le chargement', () => {
    mockWidgetData({ loading: true });
    render(<WorkflowTemplatesWidget size="small" />);
    expect(screen.getByText('Chargement...')).toBeTruthy();
  });

  it('affiche le nombre de templates', () => {
    const templates: WorkflowTemplateSummary[] = [
      { id: 't1', name: 'Securite', description: 'Check securite', nodeCount: 3 },
      { id: 't2', name: 'Backup',   description: 'Check backup',   nodeCount: 2 },
    ];
    mockWidgetData({ data: { templates, total: 2 } });
    render(<WorkflowTemplatesWidget size="small" />);
    expect(screen.getByText('2 templates')).toBeTruthy();
  });

  it('affiche les noms de templates', () => {
    const templates: WorkflowTemplateSummary[] = [
      { id: 't1', name: 'Securite', description: 'Check securite', nodeCount: 3 },
    ];
    mockWidgetData({ data: { templates, total: 1 } });
    render(<WorkflowTemplatesWidget size="small" />);
    expect(screen.getByText('Securite')).toBeTruthy();
  });
});

// ── WorkflowRunWidget ────────────────────────────────────────────────────────

describe('WorkflowRunWidget', () => {
  it('affiche l\'en-tete et le badge dry-run', () => {
    render(<WorkflowRunWidget size="medium" />);
    expect(screen.getByText(/ex.*cuter workflow/i)).toBeTruthy();
    expect(screen.getByText('dry-run')).toBeTruthy();
  });

  it('affiche un input pour l\'ID du workflow', () => {
    render(<WorkflowRunWidget size="medium" />);
    expect(screen.getByLabelText(/ID du workflow/i)).toBeTruthy();
  });

  it('affiche le bouton Run desactive si l\'ID est vide', () => {
    render(<WorkflowRunWidget size="medium" />);
    const btn = screen.getByLabelText('Lancer le workflow');
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });
});

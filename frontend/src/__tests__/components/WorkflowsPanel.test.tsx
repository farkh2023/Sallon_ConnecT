import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/hooks/useWorkflows', () => ({
  useWorkflows: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  apiPost: vi.fn().mockResolvedValue({}),
}));

import { useWorkflows } from '@/hooks/useWorkflows';
import { WorkflowsPanel } from '@/components/ai/WorkflowsPanel';
import type { WorkflowSummary, WorkflowTemplateSummary } from '@/lib/types';

const WF: WorkflowSummary = {
  id: 'diagnostic-review', name: 'Revue diagnostique',
  description: 'Analyse diagnostique complete.', enabled: true,
  nodeCount: 2, localOnly: true, dryRun: true,
};

const TEMPLATE: WorkflowTemplateSummary = {
  id: 'security-check', name: 'Securite', description: 'Verifie la securite.', nodeCount: 3,
};

const DEFAULT_HOOK = {
  workflows: [WF],
  templates: [TEMPLATE],
  runs: [],
  runResult: null,
  loading: false,
  error: null,
  loadWorkflows:     vi.fn().mockResolvedValue(undefined),
  loadTemplates:     vi.fn().mockResolvedValue(undefined),
  loadRuns:          vi.fn().mockResolvedValue(undefined),
  runWorkflow:       vi.fn().mockResolvedValue(undefined),
  createFromTemplate: vi.fn().mockResolvedValue(undefined),
  deleteWorkflow:    vi.fn().mockResolvedValue(undefined),
  exportWorkflow:    vi.fn().mockResolvedValue(undefined),
  clearResult:       vi.fn(),
};

beforeEach(() => {
  vi.mocked(useWorkflows).mockReturnValue({ ...DEFAULT_HOOK });
});

describe('WorkflowsPanel', () => {
  it('affiche le titre et les badges de securite', () => {
    render(<WorkflowsPanel />);
    expect(screen.getByText('Workflows IA locaux')).toBeTruthy();
    expect(getAllByText('Dry-run actif').length > 0 || screen.getByText(/Dry-run actif/i)).toBeTruthy();
  });

  it('affiche les onglets de navigation', () => {
    render(<WorkflowsPanel />);
    expect(screen.getByText('Workflows')).toBeTruthy();
    expect(screen.getByText('Templates')).toBeTruthy();
    expect(screen.getByText('Creer')).toBeTruthy();
    expect(screen.getByText('Import/Export')).toBeTruthy();
  });

  it('affiche la liste des workflows dans l\'onglet Workflows', () => {
    render(<WorkflowsPanel />);
    expect(screen.getByText('Revue diagnostique')).toBeTruthy();
  });

  it('bascule vers l\'onglet Templates', async () => {
    render(<WorkflowsPanel />);
    await userEvent.click(screen.getByText('Templates'));
    expect(screen.getByText('Securite')).toBeTruthy();
  });

  it('bascule vers l\'onglet Import/Export', async () => {
    render(<WorkflowsPanel />);
    await userEvent.click(screen.getByText('Import/Export'));
    expect(screen.getByText('Importer un workflow')).toBeTruthy();
  });

  it('affiche un message d\'erreur', () => {
    vi.mocked(useWorkflows).mockReturnValue({
      ...DEFAULT_HOOK,
      workflows: [],
      error: 'Erreur de chargement workflows',
    });
    render(<WorkflowsPanel />);
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('Erreur de chargement workflows')).toBeTruthy();
  });

  it('affiche le badge dry-run dans la liste des workflows', () => {
    render(<WorkflowsPanel />);
    expect(getAllByText(/dry-run/i).length > 0).toBe(true);
  });

  it('affiche les badges local-only', () => {
    render(<WorkflowsPanel />);
    expect(screen.getByText('Local uniquement')).toBeTruthy();
  });

  it('l\'onglet Creer affiche l\'editeur JSON', async () => {
    render(<WorkflowsPanel />);
    await userEvent.click(screen.getByText('Creer'));
    expect(screen.getByLabelText(/JSON/i) || screen.getByRole('textbox')).toBeTruthy();
  });
});

function getAllByText(matcher: string | RegExp): HTMLElement[] {
  return screen.queryAllByText(matcher);
}

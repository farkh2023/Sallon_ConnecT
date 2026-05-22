import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { RestoreAssistantWizard } from '@/components/backups/restore-assistant/RestoreAssistantWizard';

const VALID_ID = '20240101-120000';

const MOCK_ASSISTANT = {
  snapshotId: VALID_ID,
  status: 'ready',
  snapshot: {
    id: VALID_ID, timestamp: '2024-01-01T12:00:00.000Z',
    type: 'quick', description: 'Test snapshot', fileCount: 3,
    totalSizeKB: 50, version: '0.4.0', valid: true,
  },
  integrity: {
    ok: true,
    results: [{ snapshotId: VALID_ID, status: 'valid', verified: ['VERSION'], missing: [], corrupted: [] }],
  },
  dryRun: null,
  risk: { level: 'low', score: 5, reasons: [], blockingReasons: [] },
  checklist: [
    { id: 'verified',      label: "J'ai verifie que le snapshot est valide",                checked: false },
    { id: 'replace',       label: 'Je comprends que les donnees actuelles peuvent etre remplacees', checked: false },
    { id: 'preBackup',     label: "Je comprends qu'un backup pre-restauration sera cree",   checked: false },
    { id: 'servicePause',  label: 'Je comprends que le service peut etre arrete',           checked: false },
    { id: 'manualOnly',    label: 'La restauration se fait uniquement en PowerShell',       checked: false },
    { id: 'noAutoRestore', label: "Aucune restauration automatique n'est lancee",           checked: false },
  ],
  manualCommand: `.\\scripts\\windows\\backup\\restore-backup.ps1 -SnapshotId ${VALID_ID}`,
  safety: {
    manualOnly: true, noAutoRestore: true, noApiExecution: true,
    requiresPowerShell: true,
    message: 'La restauration ne peut pas etre effectuee automatiquement via le dashboard.',
  },
};

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

function setupFetch(...responses: unknown[]) {
  const mock = vi.fn();
  responses.forEach(r => mock.mockImplementationOnce(() => jsonResponse(r)));
  mock.mockImplementation(() => jsonResponse({ ok: true }));
  vi.stubGlobal('fetch', mock);
  return mock;
}

beforeEach(() => { vi.restoreAllMocks(); });

describe('RestoreAssistantWizard', () => {
  it('renders assistant title and snapshot id', async () => {
    setupFetch(MOCK_ASSISTANT);
    render(<RestoreAssistantWizard snapshotId={VALID_ID} onClose={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText(/assistant de restauration/i)).toBeDefined();
    });
    expect(screen.getAllByText(VALID_ID).length).toBeGreaterThan(0);
  });

  it('shows step 1 snapshot info after load', async () => {
    setupFetch(MOCK_ASSISTANT);
    render(<RestoreAssistantWizard snapshotId={VALID_ID} onClose={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText(/0\.4\.0/)).toBeDefined();
    });
  });

  it('shows progress bar with 6 steps', async () => {
    setupFetch(MOCK_ASSISTANT);
    const { container } = render(<RestoreAssistantWizard snapshotId={VALID_ID} onClose={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText(/assistant de restauration/i)).toBeDefined();
    });
    // 6 step labels
    expect(container.innerHTML).toContain('Snapshot');
    expect(container.innerHTML).toContain('Integrite');
    expect(container.innerHTML).toContain('Dry-run');
    expect(container.innerHTML).toContain('Risque');
    expect(container.innerHTML).toContain('Checklist');
    expect(container.innerHTML).toContain('Commande');
  });

  it('does NOT contain "Restaurer maintenant" button', async () => {
    setupFetch(MOCK_ASSISTANT);
    const { container } = render(<RestoreAssistantWizard snapshotId={VALID_ID} onClose={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText(/assistant de restauration/i)).toBeDefined();
    });
    expect(container.innerHTML).not.toMatch(/Restaurer maintenant/i);
  });

  it('shows no auto restore message', async () => {
    setupFetch(MOCK_ASSISTANT);
    render(<RestoreAssistantWizard snapshotId={VALID_ID} onClose={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText(/aucune restauration automatique/i)).toBeDefined();
    });
  });

  it('navigates to step 2 integrity on next', async () => {
    setupFetch(MOCK_ASSISTANT);
    render(<RestoreAssistantWizard snapshotId={VALID_ID} onClose={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText('Continuer vers la verification')).toBeDefined();
    });
    fireEvent.click(screen.getByText('Continuer vers la verification'));
    await waitFor(() => {
      expect(screen.getByText(/Integrite SHA256 confirmee/i)).toBeDefined();
    });
  });

  it('shows blocked state for blocked assistant', async () => {
    const blocked = { ...MOCK_ASSISTANT, status: 'blocked', snapshot: null, manualCommand: null };
    setupFetch(blocked);
    render(<RestoreAssistantWizard snapshotId={VALID_ID} onClose={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText(/introuvable|inaccessible/i)).toBeDefined();
    });
  });

  it('checklist step requires all items before showing command button', async () => {
    // Need to navigate to checklist — mock all the intermediate fetches
    setupFetch(MOCK_ASSISTANT);
    render(<RestoreAssistantWizard snapshotId={VALID_ID} onClose={() => {}} />);

    // Step 1 → 2
    await waitFor(() => screen.getByText('Continuer vers la verification'));
    fireEvent.click(screen.getByText('Continuer vers la verification'));

    // Step 2 → 3
    await waitFor(() => screen.getByText('Continuer vers le dry-run'));
    fireEvent.click(screen.getByText('Continuer vers le dry-run'));

    // Step 3: dry-run not loaded yet
    await waitFor(() => screen.getByText('Lancer le dry-run'));
    // Simulate dry-run fetch
    setupFetch({ status: 'ok', snapshotId: VALID_ID, wouldRestore: [], wouldReplace: [], wouldKeep: [], excluded: [], preRestoreBackup: { willBeCreated: true, type: 'quick' }, warnings: [], blockedReasons: [] });
    fireEvent.click(screen.getByText('Lancer le dry-run'));

    await waitFor(() => screen.getByText('Continuer vers le score de risque'));
    fireEvent.click(screen.getByText('Continuer vers le score de risque'));

    // Step 4: risk not loaded yet
    await waitFor(() => screen.getByText('Calculer le score'));
    setupFetch({ level: 'low', score: 5, reasons: [], blockingReasons: [] });
    fireEvent.click(screen.getByText('Calculer le score'));

    await waitFor(() => screen.getByText('Continuer vers la checklist'));
    fireEvent.click(screen.getByText('Continuer vers la checklist'));

    // Checklist step — command button disabled until all checked
    await waitFor(() => screen.getByText('Afficher la commande'));
    const cmdBtn = screen.getByText('Afficher la commande') as HTMLButtonElement;
    expect(cmdBtn.disabled).toBe(true);
  });

  it('close button calls onClose', async () => {
    setupFetch(MOCK_ASSISTANT);
    const onClose = vi.fn();
    render(<RestoreAssistantWizard snapshotId={VALID_ID} onClose={onClose} />);
    await waitFor(() => screen.getByText('Fermer'));
    fireEvent.click(screen.getByText('Fermer'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not expose C:\\Users\\ in rendered HTML', async () => {
    setupFetch(MOCK_ASSISTANT);
    const { container } = render(<RestoreAssistantWizard snapshotId={VALID_ID} onClose={() => {}} />);
    await waitFor(() => screen.getByText(/assistant de restauration/i));
    expect(container.innerHTML).not.toMatch(/C:\\Users\\/i);
  });
});

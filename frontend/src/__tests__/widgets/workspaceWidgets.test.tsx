import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/api', () => ({
  apiGet:  vi.fn(),
  apiPost: vi.fn().mockResolvedValue({ ok: true }),
}));

import { apiGet, apiPost } from '@/lib/api';
import { WorkspaceStatusWidget } from '@/widgets/examples/WorkspaceStatusWidget';
import { WorkspaceSwitcherWidget } from '@/widgets/examples/WorkspaceSwitcherWidget';
import { WorkspaceSummaryWidget } from '@/widgets/examples/WorkspaceSummaryWidget';
import type { WorkspaceProfile } from '@/lib/types';

const PROFILE: WorkspaceProfile = {
  id: 'default',
  name: 'Profil principal',
  description: 'Espace local',
  createdAt: '2026-05-24T00:00:00.000Z',
  updatedAt: '2026-05-24T00:00:00.000Z',
  isDefault: true,
  localOnly: true,
  settings: {
    theme: 'dark',
    language: 'fr',
    aiEnabled: false,
    ragEnabled: false,
    memoryEnabled: false,
    kbEnabled: false,
    workflowsEnabled: false,
    agentsEnabled: false,
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(apiGet).mockImplementation(async (url: string) => {
    if (url === '/api/workspaces/status') {
      return { ok: true, enabled: true, current: 'default', total: 2, safety: { localOnly: true } };
    }
    if (url === '/api/workspaces') {
      return { ok: true, profiles: [PROFILE, { ...PROFILE, id: 'ws_alt', name: 'Alt', isDefault: false }], total: 2, current: 'default' };
    }
    if (url === '/api/workspaces/current') {
      return { ok: true, current: PROFILE, id: 'default' };
    }
    return {};
  });
});

describe('WorkspaceStatusWidget', () => {
  it('affiche le workspace courant', async () => {
    render(<WorkspaceStatusWidget widgetId="workspace-status" size="medium" />);
    await waitFor(() => expect(screen.getByText('default')).toBeTruthy());
    expect(screen.getByText('default')).toBeTruthy();
    expect(screen.getByText('Local uniquement')).toBeTruthy();
  });
});

describe('WorkspaceSwitcherWidget', () => {
  it('liste les workspaces et switche', async () => {
    render(<WorkspaceSwitcherWidget widgetId="workspace-switcher" size="small" />);
    await waitFor(() => expect(screen.getByDisplayValue(/Profil principal/i)).toBeTruthy());
    await userEvent.selectOptions(screen.getByRole('combobox'), 'ws_alt');
    expect(apiPost).toHaveBeenCalledWith('/api/workspaces/switch', { id: 'ws_alt' });
  });
});

describe('WorkspaceSummaryWidget', () => {
  it('affiche le resume du workspace actif', async () => {
    render(<WorkspaceSummaryWidget widgetId="workspace-summary" size="medium" />);
    await waitFor(() => expect(screen.getByText('Profil principal')).toBeTruthy());
    expect(screen.getByText(/Theme: dark/i)).toBeTruthy();
    expect(screen.getByText('Workspace par defaut')).toBeTruthy();
  });
});

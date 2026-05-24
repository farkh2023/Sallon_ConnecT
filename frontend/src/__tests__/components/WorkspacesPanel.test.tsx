import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/hooks/useWorkspaces', () => ({
  useWorkspaces: vi.fn(),
}));

import { useWorkspaces } from '@/hooks/useWorkspaces';
import { WorkspacesPanel } from '@/components/workspaces/WorkspacesPanel';
import { WorkspaceSwitcher } from '@/components/workspaces/WorkspaceSwitcher';
import type { WorkspaceProfile } from '@/lib/types';

const DEFAULT_PROFILE: WorkspaceProfile = {
  id: 'default',
  name: 'Profil principal',
  description: 'Espace local par defaut',
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

const ALT_PROFILE: WorkspaceProfile = {
  ...DEFAULT_PROFILE,
  id: 'ws_alt',
  name: 'Workspace Alt',
  description: 'Second espace',
  isDefault: false,
};

const DEFAULT_HOOK = {
  profiles: [DEFAULT_PROFILE, ALT_PROFILE],
  current: DEFAULT_PROFILE,
  currentId: 'default',
  total: 2,
  enabled: true,
  loading: false,
  error: null,
  loadProfiles: vi.fn().mockResolvedValue(undefined),
  createProfile: vi.fn().mockResolvedValue(ALT_PROFILE),
  updateProfile: vi.fn().mockResolvedValue(ALT_PROFILE),
  deleteProfile: vi.fn().mockResolvedValue(true),
  switchWorkspace: vi.fn().mockResolvedValue(true),
  exportProfile: vi.fn().mockResolvedValue(true),
  importProfile: vi.fn().mockResolvedValue(ALT_PROFILE),
};

beforeEach(() => {
  vi.mocked(useWorkspaces).mockReturnValue({ ...DEFAULT_HOOK });
});

describe('WorkspacesPanel', () => {
  it('affiche l etat default et le badge local-only', () => {
    render(<WorkspacesPanel />);
    expect(screen.getByText('Workspaces locaux')).toBeTruthy();
    expect(screen.getAllByText('Profil principal').length).toBeGreaterThan(0);
    expect(screen.getByText(/Local uniquement/i)).toBeTruthy();
  });

  it('cree un workspace', async () => {
    const createProfile = vi.fn().mockResolvedValue(ALT_PROFILE);
    vi.mocked(useWorkspaces).mockReturnValue({ ...DEFAULT_HOOK, createProfile });

    render(<WorkspacesPanel />);
    await userEvent.click(screen.getByText('Nouveau'));
    await userEvent.type(screen.getByPlaceholderText('Mon workspace'), 'Nouveau profil');
    await userEvent.click(screen.getByText('Enregistrer'));

    expect(createProfile).toHaveBeenCalledWith(expect.objectContaining({ name: 'Nouveau profil' }));
  });

  it('switche vers un workspace', async () => {
    const switchWorkspace = vi.fn().mockResolvedValue(true);
    vi.mocked(useWorkspaces).mockReturnValue({ ...DEFAULT_HOOK, switchWorkspace });

    render(<WorkspacesPanel />);
    await userEvent.click(screen.getByText('Activer'));
    expect(switchWorkspace).toHaveBeenCalledWith('ws_alt');
  });

  it('edite un workspace', async () => {
    const updateProfile = vi.fn().mockResolvedValue({ ...ALT_PROFILE, name: 'Renomme' });
    vi.mocked(useWorkspaces).mockReturnValue({ ...DEFAULT_HOOK, updateProfile });

    render(<WorkspacesPanel />);
    await userEvent.click(screen.getAllByText('Editer')[1]);
    const input = screen.getByDisplayValue('Workspace Alt');
    await userEvent.clear(input);
    await userEvent.type(input, 'Renomme');
    await userEvent.click(screen.getByText('Enregistrer'));

    expect(updateProfile).toHaveBeenCalledWith('ws_alt', expect.objectContaining({ name: 'Renomme' }));
  });

  it('supprime avec confirmation', async () => {
    const deleteProfile = vi.fn().mockResolvedValue(true);
    vi.mocked(useWorkspaces).mockReturnValue({ ...DEFAULT_HOOK, deleteProfile });

    render(<WorkspacesPanel />);
    await userEvent.click(screen.getByText('Supprimer'));
    await userEvent.type(screen.getByPlaceholderText('SUPPRIMER'), 'SUPPRIMER');
    await userEvent.click(screen.getAllByText('Supprimer')[1]);

    await waitFor(() => expect(deleteProfile).toHaveBeenCalledWith('ws_alt', 'SUPPRIMER'));
  });

  it('exporte et importe un workspace', async () => {
    const exportProfile = vi.fn().mockResolvedValue(true);
    const importProfile = vi.fn().mockResolvedValue(ALT_PROFILE);
    vi.mocked(useWorkspaces).mockReturnValue({ ...DEFAULT_HOOK, exportProfile, importProfile });

    render(<WorkspacesPanel />);
    await userEvent.click(screen.getAllByText('Exporter')[0]);
    expect(exportProfile).toHaveBeenCalledWith('default');

    await userEvent.click(screen.getByText('Importer'));
    fireEvent.change(screen.getByPlaceholderText("Coller le JSON d'export ici..."), {
      target: { value: JSON.stringify({ profile: { id: 'ws_imp', name: 'Import', localOnly: true } }) },
    });
    await userEvent.click(screen.getAllByText('Importer')[1]);
    expect(importProfile).toHaveBeenCalled();
  });

  it('affiche une erreur backend lisible', () => {
    vi.mocked(useWorkspaces).mockReturnValue({ ...DEFAULT_HOOK, error: 'Erreur workspace backend' });
    render(<WorkspacesPanel />);
    expect(screen.getByText('Erreur workspace backend')).toBeTruthy();
  });
});

describe('WorkspaceSwitcher', () => {
  it('appelle onSwitch au changement', async () => {
    const onSwitch = vi.fn();
    render(<WorkspaceSwitcher profiles={[DEFAULT_PROFILE, ALT_PROFILE]} currentId="default" onSwitch={onSwitch} />);
    await userEvent.selectOptions(screen.getByRole('combobox'), 'ws_alt');
    expect(onSwitch).toHaveBeenCalledWith('ws_alt');
  });
});

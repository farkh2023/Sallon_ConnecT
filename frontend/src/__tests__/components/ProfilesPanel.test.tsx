import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProfilesPanel } from '@/components/profiles/ProfilesPanel';
import type { UserProfile } from '@/lib/types';

function jsonResponse(body: unknown) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'main',
    name: 'Profil principal',
    type: 'owner',
    enabled: true,
    createdAt: '2026-05-17T00:00:00.000Z',
    updatedAt: '2026-05-17T00:00:00.000Z',
    preferences: {
      theme: 'dark',
      accentColor: 'blue',
      defaultView: 'dashboard',
      tvModeDefault: false,
      compactMode: false,
      language: 'fr',
      refreshIntervalSeconds: 30,
      visibleSections: ['dashboard', 'devices', 'media', 'scenarios', 'notifications', 'scheduler', 'observability'],
    },
    permissions: {
      viewDevices: true,
      viewMedia: true,
      viewNotifications: true,
      viewScheduler: true,
      viewObservability: true,
      runSafeDiagnostics: true,
      runSchedulerManual: true,
      manageProfiles: true,
      executeSmartThingsScenes: false,
      executeTvCommands: false,
      startStreaming: false,
      clearAudits: true,
    },
    safety: {
      sensitiveActionsRequireConfirmation: true,
      hideSensitivePanels: false,
      readOnlyMode: false,
    },
    ...overrides,
  };
}

const guestProfile = makeProfile({
  id: 'guest',
  name: 'Profil Invité',
  type: 'guest',
  permissions: {
    viewDevices: false,
    viewMedia: true,
    viewNotifications: false,
    viewScheduler: false,
    viewObservability: false,
    runSafeDiagnostics: false,
    runSchedulerManual: false,
    manageProfiles: false,
    executeSmartThingsScenes: false,
    executeTvCommands: false,
    startStreaming: false,
    clearAudits: false,
  },
  safety: {
    sensitiveActionsRequireConfirmation: true,
    hideSensitivePanels: true,
    readOnlyMode: true,
  },
});

const PROFILES_RESPONSE = { profiles: [makeProfile(), guestProfile], total: 2 };
const ACTIVE_RESPONSE = makeProfile();
const AUDIT_RESPONSE = { entries: [], total: 0 };

function mountMock() {
  return vi.fn()
    .mockImplementationOnce(() => jsonResponse(PROFILES_RESPONSE))
    .mockImplementationOnce(() => jsonResponse(ACTIVE_RESPONSE))
    .mockImplementation(() => jsonResponse(AUDIT_RESPONSE));
}

describe('ProfilesPanel', () => {
  it('renders active profile name', async () => {
    vi.stubGlobal('fetch', mountMock());
    render(<ProfilesPanel />);
    await waitFor(() => {
      expect(screen.getAllByText('Profil principal').length).toBeGreaterThan(0);
    });
  });

  it('lists multiple profiles', async () => {
    vi.stubGlobal('fetch', mountMock());
    render(<ProfilesPanel />);
    await waitFor(() => {
      expect(screen.getAllByText(/Profil principal|Profil Invité/).length).toBeGreaterThan(0);
    });
  });

  it('shows Activer button for non-active profile', async () => {
    vi.stubGlobal('fetch', mountMock());
    render(<ProfilesPanel />);
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Activer/i }).length).toBeGreaterThan(0);
    });
  });

  it('displays read-only mode badge for guest', async () => {
    const activeMock = vi.fn()
      .mockImplementationOnce(() => jsonResponse(PROFILES_RESPONSE))
      .mockImplementationOnce(() => jsonResponse(guestProfile))
      .mockImplementation(() => jsonResponse(AUDIT_RESPONSE));
    vi.stubGlobal('fetch', activeMock);
    render(<ProfilesPanel />);
    await waitFor(() => {
      expect(screen.getAllByText(/lecture seule/i).length).toBeGreaterThan(0);
    });
  });

  it('shows safety notice', async () => {
    vi.stubGlobal('fetch', mountMock());
    render(<ProfilesPanel />);
    expect(screen.getByText(/100% locaux/i)).toBeDefined();
  });

  it('shows permissions section', async () => {
    vi.stubGlobal('fetch', mountMock());
    render(<ProfilesPanel />);
    await waitFor(() => {
      expect(screen.getAllByText(/Permissions/i).length).toBeGreaterThan(0);
    });
  });

  it('does not display sensitive data', async () => {
    vi.stubGlobal('fetch', mountMock());
    const { container } = render(<ProfilesPanel />);
    await waitFor(() => screen.getAllByText(/Profil/).length > 0);
    const html = container.innerHTML;
    expect(html).not.toMatch(/Bearer/i);
    expect(html).not.toMatch(/password/i);
    expect(html).not.toMatch(/token/i);
    expect(html).not.toMatch(/[A-Za-z]:\\[^\s"]{20,}/);
  });
});

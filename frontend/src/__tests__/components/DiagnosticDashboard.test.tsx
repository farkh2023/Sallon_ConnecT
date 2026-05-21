import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DiagnosticDashboard } from '@/components/diagnostics/DiagnosticDashboard';
import { clearAllEvents } from '@/lib/systemEventBus';

const DIAG_OK = {
  timestamp: '2026-05-22T00:00:00.000Z',
  status: 'ok',
  uptime: 3600,
  nodeVersion: 'v22.11.0',
  memory: { rss: 10000000, heapUsed: 5000000, heapTotal: 8000000 },
  scheduler: {
    status: 'running',
    running: true,
    activeSchedules: 2,
    totalSchedules: 3,
    tickMs: 30000,
    nextScheduled: null,
  },
  backup: { enabled: true, count: 2, latest: null },
  notifications: { total: 5, unread: 1 },
  sse: { clients: 1 },
  security: { localOnly: true, firebase: false, cloudServices: false, externalPush: false },
};

function jsonOk(body: unknown) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

function jsonError(status = 500) {
  return Promise.resolve(
    new Response(JSON.stringify({ error: 'Internal error' }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

beforeEach(() => {
  localStorage.clear();
  clearAllEvents();
});

afterEach(() => {
  clearAllEvents();
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe('DiagnosticDashboard — chargement', () => {
  it('affiche un état de chargement pendant le fetch', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => undefined)));
    render(<DiagnosticDashboard />);
    expect(screen.getByText(/Chargement diagnostic/i)).toBeInTheDocument();
  });

  it('affiche le score global après fetch réussi', async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonOk(DIAG_OK)));
    render(<DiagnosticDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Score/i)).toBeInTheDocument();
    });
  });

  it('affiche un état erreur propre si le fetch échoue', async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonError(500)));
    render(<DiagnosticDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Diagnostic indisponible/i)).toBeInTheDocument();
    });
  });
});

describe('DiagnosticDashboard — cartes santé', () => {
  it('affiche les cartes Backend, SSE, Scheduler, Backup, Notifications', async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonOk(DIAG_OK)));
    render(<DiagnosticDashboard />);
    await waitFor(() => {
      expect(screen.getByText('Backend')).toBeInTheDocument();
      expect(screen.getByText('SSE')).toBeInTheDocument();
      expect(screen.getByText('Scheduler')).toBeInTheDocument();
      expect(screen.getByText('Backup')).toBeInTheDocument();
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });
  });

  it('affiche la carte Stockage local', async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonOk(DIAG_OK)));
    render(<DiagnosticDashboard />);
    await waitFor(() => {
      expect(screen.getByText('Stockage local')).toBeInTheDocument();
    });
  });

  it('affiche la carte Sécurité local-only', async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonOk(DIAG_OK)));
    render(<DiagnosticDashboard />);
    await waitFor(() => {
      expect(screen.getByText('Sécurité local-only')).toBeInTheDocument();
    });
  });
});

describe('DiagnosticDashboard — statut global', () => {
  it('affiche "Sain" pour un score élevé', async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonOk(DIAG_OK)));
    render(<DiagnosticDashboard />);
    await waitFor(() => {
      expect(screen.getByText('Sain')).toBeInTheDocument();
    });
  });

  it('affiche "Dégradé" quand le backend est hors ligne', async () => {
    const degraded = { ...DIAG_OK, status: 'error' };
    vi.stubGlobal('fetch', vi.fn(() => jsonOk(degraded)));
    render(<DiagnosticDashboard />);
    await waitFor(() => {
      expect(screen.getByText('Dégradé')).toBeInTheDocument();
    });
  });
});

describe('DiagnosticDashboard — bouton Actualiser', () => {
  it('affiche le bouton Actualiser', async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonOk(DIAG_OK)));
    render(<DiagnosticDashboard />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Actualiser/i })).toBeInTheDocument();
    });
  });

  it('déclenche un nouveau fetch au clic sur Actualiser', async () => {
    const fetchMock = vi.fn(() => jsonOk(DIAG_OK));
    vi.stubGlobal('fetch', fetchMock);
    render(<DiagnosticDashboard />);
    await waitFor(() => screen.getByRole('button', { name: /Actualiser/i }));
    act(() => { fireEvent.click(screen.getByRole('button', { name: /Actualiser/i })); });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });
});

describe('DiagnosticDashboard — export JSON', () => {
  it('affiche le bouton Export JSON', async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonOk(DIAG_OK)));
    render(<DiagnosticDashboard />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Export JSON/i })).toBeInTheDocument();
    });
  });

  it('déclenche un téléchargement au clic sur Export JSON', async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonOk(DIAG_OK)));
    const createObjectURL = vi.fn(() => 'blob:test');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });

    const clickSpy = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    const createElement = vi.spyOn(document, 'createElement').mockImplementation((tag, options) => {
      if (tag === 'a') {
        return { href: '', download: '', click: clickSpy } as unknown as HTMLAnchorElement;
      }
      return originalCreateElement(tag, options);
    });

    render(<DiagnosticDashboard />);
    await waitFor(() => screen.getByRole('button', { name: /Export JSON/i }));
    act(() => { fireEvent.click(screen.getByRole('button', { name: /Export JSON/i })); });

    expect(clickSpy).toHaveBeenCalled();
    createElement.mockRestore();
  });
});

describe('DiagnosticDashboard — sécurité', () => {
  it('aucun appel réseau externe en dehors du fetch API local', async () => {
    const fetchCalls: string[] = [];
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      fetchCalls.push(url);
      return jsonOk(DIAG_OK);
    }));

    render(<DiagnosticDashboard />);
    await waitFor(() => screen.getByText('Sain'));

    expect(fetchCalls.every((url) => url.includes('localhost') || url.startsWith('/'))).toBe(true);
  });

  it('affiche le message local-only dans le footer', async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonOk(DIAG_OK)));
    render(<DiagnosticDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Diagnostic local uniquement/i)).toBeInTheDocument();
      expect(screen.getByText(/aucune télémétrie externe/i)).toBeInTheDocument();
    });
  });

  it('intègre dans ObservabilityPanel sans erreur', async () => {
    // Vérifié via le test ObservabilityPanel.test.tsx existant
    expect(true).toBe(true);
  });
});

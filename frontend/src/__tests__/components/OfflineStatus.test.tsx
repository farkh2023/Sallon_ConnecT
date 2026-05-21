import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OfflineStatus } from '@/components/pwa/OfflineStatus';

describe('OfflineStatus', () => {
  it('affiche "Vérification…" au premier rendu avant la réponse API', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
    render(<OfflineStatus />);
    expect(screen.getByText('Vérification…')).toBeInTheDocument();
  });

  it('affiche "Backend local indisponible" quand le fetch échoue', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    render(<OfflineStatus />);
    await waitFor(() => {
      expect(screen.getByText('Backend local indisponible')).toBeInTheDocument();
    });
  });

  it('affiche "En ligne" quand le backend répond ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok', phase: 27 }),
    }));
    render(<OfflineStatus />);
    await waitFor(() => {
      expect(screen.getByText('En ligne')).toBeInTheDocument();
    });
  });

  it('n\'affiche pas de rouge avant la première réponse API', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
    render(<OfflineStatus />);
    expect(screen.queryByText('Backend local indisponible')).toBeNull();
    expect(screen.queryByText('Hors ligne')).toBeNull();
  });
});

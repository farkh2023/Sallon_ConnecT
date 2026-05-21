import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SystemEventsPanel } from '@/components/observability/SystemEventsPanel';
import {
  clearAllEvents,
  emitSystemEvent,
  markAllEventsRead,
} from '@/lib/systemEventBus';

beforeEach(() => {
  localStorage.clear();
  clearAllEvents();
});
afterEach(() => {
  cleanup();
  clearAllEvents();
  localStorage.clear();
});

function emit(overrides: Partial<Parameters<typeof emitSystemEvent>[0]> = {}) {
  emitSystemEvent({
    type: 'test.event',
    severity: 'info',
    source: 'backend',
    message: 'Message test',
    ...overrides,
  });
}

describe('SystemEventsPanel — état vide', () => {
  it('affiche un message quand il n\'y a aucun événement', () => {
    render(<SystemEventsPanel />);
    expect(screen.getByText(/Aucun événement enregistré/)).toBeInTheDocument();
  });

  it('bouton "Marquer comme lu" est désactivé sans événements non lus', () => {
    render(<SystemEventsPanel />);
    expect(screen.getByRole('button', { name: /Marquer comme lu/i })).toBeDisabled();
  });
});

describe('SystemEventsPanel — création d\'événement', () => {
  it('affiche un événement émis', async () => {
    render(<SystemEventsPanel />);
    act(() => { emit({ message: 'Backend en ligne' }); });
    expect(await screen.findByText('Backend en ligne')).toBeInTheDocument();
  });

  it('affiche le badge non lus', async () => {
    render(<SystemEventsPanel />);
    act(() => { emit(); emit(); emit(); });
    expect(await screen.findByText(/3 non lus/)).toBeInTheDocument();
  });

  it('affiche les détails optionnels', async () => {
    render(<SystemEventsPanel />);
    act(() => { emit({ details: 'Phase 27' }); });
    expect(await screen.findByText('Phase 27')).toBeInTheDocument();
  });
});

describe('SystemEventsPanel — filtrage', () => {
  it('filtre par severity error — seuls les événements error sont affichés', async () => {
    render(<SystemEventsPanel />);
    await act(async () => {
      emit({ severity: 'info',  message: 'evt-info-A' });
      emit({ severity: 'error', message: 'evt-error-B' });
    });
    await screen.findByText('evt-error-B');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^Erreur$/ }));
    });
    await screen.findByText('evt-error-B');
    expect(screen.queryByText('evt-info-A')).toBeNull();
  });

  it('filtre par source security — seuls les événements security sont affichés', async () => {
    render(<SystemEventsPanel />);
    await act(async () => {
      emit({ source: 'backend',  message: 'evt-backend-C' });
      emit({ source: 'security', message: 'evt-security-D' });
    });
    await screen.findByText('evt-security-D');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^Sécurité$/ }));
    });
    await screen.findByText('evt-security-D');
    expect(screen.queryByText('evt-backend-C')).toBeNull();
  });

  it('filtre "Tous" réaffiche les événements masqués', async () => {
    render(<SystemEventsPanel />);
    await act(async () => {
      emit({ severity: 'info',  message: 'evt-info-E' });
      emit({ severity: 'error', message: 'evt-error-F' });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^Erreur$/ }));
    });
    expect(screen.queryByText('evt-info-E')).toBeNull();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^Tous$/ }));
    });
    expect(await screen.findByText('evt-info-E')).toBeInTheDocument();
    expect(screen.getByText('evt-error-F')).toBeInTheDocument();
  });
});

describe('SystemEventsPanel — marquer comme lu', () => {
  it('marquer un événement individuel comme lu', async () => {
    render(<SystemEventsPanel />);
    act(() => { emit({ message: 'À lire' }); });
    const luBtn = await screen.findByRole('button', { name: /^lu$/ });
    fireEvent.click(luBtn);
    expect(screen.queryByRole('button', { name: /^lu$/ })).toBeNull();
  });

  it('marquer tous les événements comme lus', async () => {
    render(<SystemEventsPanel />);
    act(() => { emit(); emit(); emit(); });
    await screen.findByText(/3 non lus/);
    fireEvent.click(screen.getByRole('button', { name: /Marquer comme lu/i }));
    expect(screen.queryByText(/non lu/)).toBeNull();
  });
});

describe('SystemEventsPanel — vider le journal', () => {
  it('demande confirmation avant d\'effacer', async () => {
    render(<SystemEventsPanel />);
    act(() => { emit(); });
    await screen.findByText('Message test');
    fireEvent.click(screen.getByRole('button', { name: /^Effacer$/ }));
    expect(screen.getByRole('button', { name: /Confirmer effacement/ })).toBeInTheDocument();
  });

  it('efface après confirmation', async () => {
    render(<SystemEventsPanel />);
    act(() => { emit({ message: 'Evt à effacer' }); });
    await screen.findByText('Evt à effacer');
    fireEvent.click(screen.getByRole('button', { name: /^Effacer$/ }));
    fireEvent.click(screen.getByRole('button', { name: /Confirmer effacement/ }));
    expect(await screen.findByText(/Aucun événement enregistré/)).toBeInTheDocument();
  });

  it('annuler empêche l\'effacement', async () => {
    render(<SystemEventsPanel />);
    act(() => { emit({ message: 'Conservé' }); });
    await screen.findByText('Conservé');
    fireEvent.click(screen.getByRole('button', { name: /^Effacer$/ }));
    fireEvent.click(screen.getByRole('button', { name: /Annuler/ }));
    expect(screen.getByText('Conservé')).toBeInTheDocument();
  });
});

describe('SystemEventsPanel — statut SSE', () => {
  it('affiche le statut SSE désactivé quand EventSource est absent', () => {
    // In jsdom, EventSource is undefined → hook sets state to 'disabled'
    render(<SystemEventsPanel />);
    const badge = screen.getByLabelText('sse-status');
    expect(badge.textContent).toMatch(/désactivé/);
  });
});

describe('SystemEventsPanel — sécurité', () => {
  it('aucun contenu sensible affiché', async () => {
    render(<SystemEventsPanel />);
    act(() => {
      emit({ message: 'token=[masqué]', source: 'security' });
    });
    const { container } = render(<SystemEventsPanel />);
    expect(container.textContent).not.toContain('Bearer ');
    expect(container.textContent).not.toContain('password=');
  });

  it('compteur non lus est nul après markAllEventsRead externe', async () => {
    render(<SystemEventsPanel />);
    act(() => { emit(); emit(); });
    await screen.findByText(/2 non lus/);
    act(() => { markAllEventsRead(); });
    expect(screen.queryByText(/non lu/)).toBeNull();
  });
});

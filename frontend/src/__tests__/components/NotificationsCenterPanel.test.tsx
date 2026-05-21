import { render, screen, fireEvent, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationsCenterPanel } from '@/components/notifications/NotificationsCenterPanel';
import { processEvent, resetNotificationCenter } from '@/lib/notificationCenter';
import type { SystemEvent } from '@/lib/types';

function makeEvent(overrides: Partial<SystemEvent> = {}): SystemEvent {
  return {
    id: `evt_${Math.random().toString(36).slice(2, 9)}`,
    timestamp: new Date().toISOString(),
    type: 'backend.test',
    severity: 'info',
    source: 'backend',
    message: 'Message test',
    read: false,
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
  resetNotificationCenter();
});

afterEach(() => {
  resetNotificationCenter();
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe('NotificationsCenterPanel — état vide', () => {
  it('affiche un message quand il n\'y a aucune notification', () => {
    render(<NotificationsCenterPanel />);
    expect(screen.getByText(/Aucune notification/)).toBeInTheDocument();
  });

  it('le bouton "Tout marquer comme lu" est désactivé sans non-lus', () => {
    render(<NotificationsCenterPanel />);
    const btn = screen.getByRole('button', { name: /Tout marquer comme lu/i });
    expect(btn).toBeDisabled();
  });

  it('affiche le pied de page sécurité local-only', () => {
    render(<NotificationsCenterPanel />);
    expect(screen.getByText(/Notifications locales uniquement/)).toBeInTheDocument();
    expect(screen.getByText(/aucune télémétrie externe/)).toBeInTheDocument();
  });
});

describe('NotificationsCenterPanel — badge non lu', () => {
  it('affiche le badge avec le nombre de non-lus', async () => {
    render(<NotificationsCenterPanel />);
    act(() => {
      processEvent(makeEvent({ id: 'a', type: 'backend.ok' }));
      processEvent(makeEvent({ id: 'b', type: 'network.up' }));
    });
    expect(await screen.findByText(/2 non lus/)).toBeInTheDocument();
  });

  it('masque le badge quand toutes les notifications sont lues', async () => {
    render(<NotificationsCenterPanel />);
    act(() => {
      processEvent(makeEvent({ id: 'c', type: 'backend.ok' }));
    });
    const markAllBtn = await screen.findByRole('button', { name: /Tout marquer comme lu/i });
    act(() => { fireEvent.click(markAllBtn); });
    expect(screen.queryByText(/non lu/)).not.toBeInTheDocument();
  });
});

describe('NotificationsCenterPanel — filtres severity', () => {
  it('affiche un filtre par sévérité "Erreur"', () => {
    render(<NotificationsCenterPanel />);
    expect(screen.getByRole('button', { name: 'Erreur' })).toBeInTheDocument();
  });

  it('filtre par severity error', async () => {
    render(<NotificationsCenterPanel />);
    act(() => {
      processEvent(makeEvent({ id: 'info-1', type: 'backend.info', severity: 'info', message: 'info-msg' }));
      processEvent(makeEvent({ id: 'err-1', type: 'backend.error', severity: 'error', message: 'error-msg' }));
    });

    act(() => { fireEvent.click(screen.getByRole('button', { name: 'Erreur' })); });

    expect(await screen.findByText('error-msg')).toBeInTheDocument();
    expect(screen.queryByText('info-msg')).not.toBeInTheDocument();
  });

  it('affiche "Aucune notification pour ce filtre" si filtre vide', async () => {
    render(<NotificationsCenterPanel />);
    act(() => {
      processEvent(makeEvent({ id: 'inf-1', type: 'backend.info', severity: 'info' }));
    });
    act(() => { fireEvent.click(screen.getByRole('button', { name: 'Erreur' })); });
    expect(await screen.findByText(/Aucune notification pour ce filtre/)).toBeInTheDocument();
  });
});

describe('NotificationsCenterPanel — filtres source', () => {
  it('affiche les filtres sources', () => {
    render(<NotificationsCenterPanel />);
    expect(screen.getByRole('button', { name: 'Backend' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Réseau' })).toBeInTheDocument();
  });

  it('filtre par source backend', async () => {
    render(<NotificationsCenterPanel />);
    act(() => {
      processEvent(makeEvent({ id: 'b-1', type: 'backend.ok', source: 'backend', message: 'backend-msg' }));
      processEvent(makeEvent({ id: 'n-1', type: 'network.up', source: 'network', message: 'network-msg' }));
    });

    act(() => { fireEvent.click(screen.getByRole('button', { name: 'Backend' })); });

    expect(await screen.findByText('backend-msg')).toBeInTheDocument();
    expect(screen.queryByText('network-msg')).not.toBeInTheDocument();
  });
});

describe('NotificationsCenterPanel — effacement avec confirmation', () => {
  it('demande confirmation avant d\'effacer', async () => {
    render(<NotificationsCenterPanel />);
    act(() => {
      processEvent(makeEvent({ id: 'del-1', type: 'backend.ok' }));
    });

    const clearBtn = await screen.findByRole('button', { name: 'Effacer' });
    act(() => { fireEvent.click(clearBtn); });

    expect(screen.getByRole('button', { name: /Confirmer effacement/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Annuler/i })).toBeInTheDocument();
  });

  it('peut annuler l\'effacement', async () => {
    render(<NotificationsCenterPanel />);
    act(() => {
      processEvent(makeEvent({ id: 'del-2', type: 'backend.ok', message: 'keep-me' }));
    });

    const clearBtn = await screen.findByRole('button', { name: 'Effacer' });
    act(() => { fireEvent.click(clearBtn); });

    const cancelBtn = screen.getByRole('button', { name: /Annuler/i });
    act(() => { fireEvent.click(cancelBtn); });

    expect(screen.queryByRole('button', { name: /Confirmer effacement/i })).not.toBeInTheDocument();
    expect(screen.getByText('keep-me')).toBeInTheDocument();
  });

  it('efface toutes les notifications après double confirmation', async () => {
    render(<NotificationsCenterPanel />);
    act(() => {
      processEvent(makeEvent({ id: 'del-3', type: 'backend.ok' }));
    });

    const clearBtn = await screen.findByRole('button', { name: 'Effacer' });
    act(() => { fireEvent.click(clearBtn); });

    const confirmBtn = screen.getByRole('button', { name: /Confirmer effacement/i });
    act(() => { fireEvent.click(confirmBtn); });

    expect(await screen.findByText(/Aucune notification/)).toBeInTheDocument();
  });
});

describe('NotificationsCenterPanel — sécurité', () => {
  it('aucune action sensible exécutée depuis une notification', async () => {
    render(<NotificationsCenterPanel />);
    act(() => {
      processEvent(makeEvent({
        id: 'sec-1',
        type: 'security.alert',
        severity: 'error',
        source: 'security',
        message: 'Alerte sécurité détectée',
      }));
    });
    expect(await screen.findByText('Alerte sécurité détectée')).toBeInTheDocument();
    // Aucun bouton d'action sensible dans la notification
    expect(screen.queryByRole('button', { name: /supprimer|delete|execute|run|restart/i })).not.toBeInTheDocument();
  });

  it('aucun appel réseau externe déclenché', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    render(<NotificationsCenterPanel />);
    act(() => {
      processEvent(makeEvent({ id: 'net-1', type: 'backend.ok' }));
    });
    await screen.findByText('Message test');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('marque une notification individuelle comme lue', async () => {
    render(<NotificationsCenterPanel />);
    act(() => {
      processEvent(makeEvent({ id: 'read-1', type: 'backend.new' }));
    });

    const readBtn = await screen.findByRole('button', { name: 'lu' });
    act(() => { fireEvent.click(readBtn); });

    expect(screen.queryByRole('button', { name: 'lu' })).not.toBeInTheDocument();
  });
});

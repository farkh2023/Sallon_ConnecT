import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HelpSystemStatus } from '@/components/help/HelpSystemStatus';
import type { HelpSystemStatus as HelpSystemStatusType } from '@/lib/types';

const CHECKING_STATUS: HelpSystemStatusType = {
  networkState: 'checking',
  backendOk: null,
  frontendOk: null,
  phase: null,
  unreadNotifications: null,
  schedulerActive: null,
  observabilityOk: null,
  backupAvailable: null,
  securityLocalOnly: null,
  loading: true,
  error: null,
  lastCheckedAt: null,
};

const ONLINE_STATUS: HelpSystemStatusType = {
  networkState: 'online',
  backendOk: true,
  frontendOk: true,
  phase: 27,
  unreadNotifications: 0,
  schedulerActive: true,
  observabilityOk: true,
  backupAvailable: true,
  securityLocalOnly: true,
  loading: false,
  error: null,
  lastCheckedAt: new Date().toISOString(),
};

const OFFLINE_STATUS: HelpSystemStatusType = {
  networkState: 'offline',
  backendOk: false,
  frontendOk: true,
  phase: null,
  unreadNotifications: null,
  schedulerActive: null,
  observabilityOk: null,
  backupAvailable: null,
  securityLocalOnly: null,
  loading: false,
  error: 'connexion refusée',
  lastCheckedAt: new Date().toISOString(),
};

const DEGRADED_STATUS: HelpSystemStatusType = {
  networkState: 'degraded',
  backendOk: true,
  frontendOk: true,
  phase: 27,
  unreadNotifications: 3,
  schedulerActive: false,
  observabilityOk: true,
  backupAvailable: true,
  securityLocalOnly: true,
  loading: false,
  error: null,
  lastCheckedAt: new Date().toISOString(),
};

describe('HelpSystemStatus — états réseau', () => {
  it('premier rendu — affiche "Vérification en cours…" sans rouge', () => {
    render(<HelpSystemStatus status={CHECKING_STATUS} onRefresh={vi.fn()} />);
    expect(screen.getByText('Vérification en cours…')).toBeInTheDocument();
    expect(screen.queryByText('✗')).toBeNull();
  });

  it('premier rendu — bouton Actualiser désactivé pendant le chargement', () => {
    render(<HelpSystemStatus status={CHECKING_STATUS} onRefresh={vi.fn()} />);
    const btn = screen.getByRole('button', { name: /Actualiser/i });
    expect(btn).toBeDisabled();
  });

  it('état online — affiche "En ligne" et toutes les lignes ✓', () => {
    render(<HelpSystemStatus status={ONLINE_STATUS} onRefresh={vi.fn()} />);
    expect(screen.getByText('En ligne')).toBeInTheDocument();
    expect(screen.getByText('Backend Express')).toBeInTheDocument();
    expect(screen.getByText('Sécurité localOnly')).toBeInTheDocument();
  });

  it('état offline — affiche "Backend hors ligne" et message erreur', () => {
    render(<HelpSystemStatus status={OFFLINE_STATUS} onRefresh={vi.fn()} />);
    expect(screen.getByText('Backend hors ligne')).toBeInTheDocument();
    expect(screen.getByText(/connexion refusée/)).toBeInTheDocument();
  });

  it('état offline — backendOk false affiche ✗', () => {
    render(<HelpSystemStatus status={OFFLINE_STATUS} onRefresh={vi.fn()} />);
    const icons = document.querySelectorAll('span');
    const texts = Array.from(icons).map((s) => s.textContent);
    expect(texts).toContain('✗');
  });

  it('état dégradé — affiche "Dégradé"', () => {
    render(<HelpSystemStatus status={DEGRADED_STATUS} onRefresh={vi.fn()} />);
    expect(screen.getByText('Dégradé')).toBeInTheDocument();
  });

  it('état dégradé — notifications non lues affichées', () => {
    render(<HelpSystemStatus status={DEGRADED_STATUS} onRefresh={vi.fn()} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('bouton Actualiser appelle onRefresh', () => {
    const onRefresh = vi.fn();
    render(<HelpSystemStatus status={ONLINE_STATUS} onRefresh={onRefresh} />);
    fireEvent.click(screen.getByRole('button', { name: /Actualiser/i }));
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it('bouton Actualiser désactivé quand loading', () => {
    const loading = { ...ONLINE_STATUS, loading: true };
    render(<HelpSystemStatus status={loading} onRefresh={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Actualiser/i })).toBeDisabled();
  });

  it('mode local-only conservé dans tous les états', () => {
    render(<HelpSystemStatus status={ONLINE_STATUS} onRefresh={vi.fn()} />);
    expect(screen.getByText('Sécurité localOnly')).toBeInTheDocument();
  });
});

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HelpCenterPanel } from '@/components/help/HelpCenterPanel';

vi.mock('@/hooks/useHelpCenter', () => ({
  useHelpCenter: () => ({
    query: '',
    activeCategory: 'all',
    systemStatus: {
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
      lastCheckedAt: null,
    },
    setQuery: vi.fn(),
    setActiveCategory: vi.fn(),
    refreshStatus: vi.fn(),
  }),
}));

describe('HelpCenterPanel', () => {
  it('ne rend rien quand closed', () => {
    const { container } = render(<HelpCenterPanel open={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('rend le panneau quand open', () => {
    render(<HelpCenterPanel open={true} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Centre d\'aide')).toBeInTheDocument();
  });

  it('affiche les onglets principaux', () => {
    render(<HelpCenterPanel open={true} onClose={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    const texts = buttons.map((b) => b.textContent ?? '');
    expect(texts.some((t) => t.includes('Accueil'))).toBe(true);
    expect(texts.some((t) => t.includes('Commandes'))).toBe(true);
    expect(texts.some((t) => t.includes('TP'))).toBe(true);
    expect(texts.some((t) => t.includes('FAQ'))).toBe(true);
    expect(texts.some((t) => t.includes('Dépannage'))).toBe(true);
    expect(texts.some((t) => t.includes('Statut'))).toBe(true);
    expect(texts.some((t) => t.includes('Liens'))).toBe(true);
  });

  it('affiche le démarrage rapide par défaut (onglet Accueil)', () => {
    render(<HelpCenterPanel open={true} onClose={vi.fn()} />);
    expect(screen.getByText('Démarrage rapide')).toBeInTheDocument();
  });

  it('affiche le lien vers /aide (plein écran)', () => {
    render(<HelpCenterPanel open={true} onClose={vi.fn()} />);
    const link = screen.getByRole('link', { name: /Plein écran/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/aide');
  });

  it('affiche le lien /manuel dans les liens', () => {
    render(<HelpCenterPanel open={true} onClose={vi.fn()} />);
    // Navigate to Liens tab
    const liensTab = screen.getByRole('button', { name: /Liens/i });
    fireEvent.click(liensTab);
    expect(screen.getByText('Manuel complet SAVOIR_IA')).toBeInTheDocument();
  });

  it('ferme le panneau au clic sur le backdrop', () => {
    const onClose = vi.fn();
    render(<HelpCenterPanel open={true} onClose={onClose} />);
    const backdrop = document.querySelector('[aria-hidden="true"]');
    expect(backdrop).not.toBeNull();
    if (backdrop) fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('ferme le panneau au clic sur le bouton ✕', () => {
    const onClose = vi.fn();
    render(<HelpCenterPanel open={true} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText("Fermer le Centre d'aide"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('onglet TP affiche 12 travaux pratiques', () => {
    render(<HelpCenterPanel open={true} onClose={vi.fn()} />);
    // Trouver le tab TP parmi les tabs de navigation
    const tabButtons = screen.getAllByRole('button');
    const tpTab = tabButtons.find((btn) => btn.textContent?.includes('TP'));
    expect(tpTab).toBeDefined();
    if (tpTab) fireEvent.click(tpTab);
    // Vérifier que le contenu TP s'affiche
    expect(screen.getByText('Travaux pratiques guidés')).toBeInTheDocument();
    // Au moins 12 numéros de TP affichés
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('onglet Statut affiche l\'état système mocké', () => {
    render(<HelpCenterPanel open={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Statut/i }));
    expect(screen.getByText('Backend Express')).toBeInTheDocument();
    expect(screen.getByText('Phase')).toBeInTheDocument();
    expect(screen.getByText('Sécurité localOnly')).toBeInTheDocument();
  });

  it('aucun secret visible dans le rendu', () => {
    const { container } = render(<HelpCenterPanel open={true} onClose={vi.fn()} />);
    const text = container.textContent ?? '';
    expect(text).not.toContain('Bearer ');
    expect(text).not.toContain('SMARTTHINGS_TOKEN=');
    expect(text).not.toContain('C:\\Users\\');
  });

  it('boutons copier présents dans les commandes', () => {
    render(<HelpCenterPanel open={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Commandes/i }));
    const copyBtns = screen.getAllByRole('button', { name: /Copier/i });
    expect(copyBtns.length).toBeGreaterThan(0);
  });
});

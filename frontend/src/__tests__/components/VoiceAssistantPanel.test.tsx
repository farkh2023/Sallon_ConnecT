import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { VoiceAssistantPanel } from '@/components/voice/VoiceAssistantPanel';

vi.mock('@/hooks/useTvMode', () => ({
  useTvMode: () => ({
    enabled: false,
    fullscreen: false,
    fullscreenSupported: false,
    fullscreenError: null,
    activePanel: null,
    lastRefreshAt: null,
    setActivePanel: vi.fn(),
    toggleTvMode: vi.fn(),
    enableTvMode: vi.fn(),
    disableTvMode: vi.fn(),
    requestRefresh: vi.fn(),
    enterFullscreen: vi.fn(),
    exitFullscreen: vi.fn(),
    toggleFullscreen: vi.fn(),
  }),
}));

describe('VoiceAssistantPanel', () => {
  it('renders with text fallback when SpeechRecognition is absent', () => {
    render(<VoiceAssistantPanel open onClose={vi.fn()} />);

    expect(screen.getByText('Assistant vocal local')).toBeInTheDocument();
    expect(screen.getByText(/fallback texte/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/ouvre les appareils/i)).toBeInTheDocument();
  });

  it('runs a safe text fallback command', async () => {
    render(<VoiceAssistantPanel open onClose={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText(/ouvre les appareils/i), {
      target: { value: 'ouvre les appareils' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Envoyer/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/Ouverture : Ouvrir Appareils/i).length).toBeGreaterThan(0);
    });
  });

  it('blocks sensitive text fallback commands', async () => {
    render(<VoiceAssistantPanel open onClose={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText(/ouvre les appareils/i), {
      target: { value: 'allume la tele' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Envoyer/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/Commande refusee/i).length).toBeGreaterThan(0);
    });
  });
});

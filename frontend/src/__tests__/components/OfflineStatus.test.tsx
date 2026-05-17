import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OfflineStatus } from '@/components/pwa/OfflineStatus';

describe('OfflineStatus', () => {
  it('shows backend unavailable when health fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    render(<OfflineStatus />);

    await waitFor(() => {
      expect(screen.getByText('Backend local indisponible')).toBeInTheDocument();
    });
  });
});

import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NotificationsPanel } from '@/components/notifications/NotificationsPanel';

function jsonResponse(body: unknown) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

describe('NotificationsPanel', () => {
  it('shows the empty state from mocked API responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('/api/notifications/stats')) {
          return jsonResponse({ total: 0, unread: 0, byType: {}, byLevel: {}, lastNotificationAt: null });
        }
        return jsonResponse({ notifications: [] });
      })
    );

    render(<NotificationsPanel />);

    await waitFor(() => {
      expect(screen.getByText('Aucune notification')).toBeInTheDocument();
    });
  });
});

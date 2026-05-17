import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SchedulerPanel } from '@/components/scheduler/SchedulerPanel';

function jsonResponse(body: unknown) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

describe('SchedulerPanel', () => {
  it('renders scheduler status and schedules from mocked API responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('/api/scheduler/status')) {
          return jsonResponse({
            status: 'running',
            enabled: true,
            activeSchedules: 1,
            totalSchedules: 2,
            tickMs: 30000,
            nextScheduled: { name: 'Health check local', at: new Date().toISOString() },
          });
        }
        if (url.includes('/api/scheduler/schedules')) {
          return jsonResponse({
            schedules: [
              {
                id: 'schedule-1',
                name: 'Health check local',
                actionType: 'system.healthCheck',
                enabled: true,
                schedule: { type: 'manual' },
                lastRunAt: null,
                nextRunAt: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
          });
        }
        return jsonResponse({ history: [] });
      })
    );

    render(<SchedulerPanel />);

    await waitFor(() => {
      expect(screen.getByText(/1\/2/)).toBeInTheDocument();
      expect(screen.getAllByText('Health check local')).toHaveLength(2);
      expect(screen.getByText(/system\.healthCheck/)).toBeInTheDocument();
    });
  });
});

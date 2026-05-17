import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ObservabilityCharts } from '@/components/observability/charts/ObservabilityCharts';
import type { SnapshotTimelineResponse, SnapshotChartFilters } from '@/lib/types';

// Mock Recharts to avoid jsdom SVG issues
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="recharts-responsive">{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="recharts-areachart">{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="recharts-linechart">{children}</div>,
  RadarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="recharts-radarchart">{children}</div>,
  Area: () => null,
  Line: () => null,
  Radar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  PolarGrid: () => null,
  PolarAngleAxis: () => null,
  defs: () => null,
  linearGradient: () => null,
  stop: () => null,
}));

function makeTimeline(count = 3): SnapshotTimelineResponse {
  const statuses = ['ok', 'warning', 'ok'] as const;
  const items = Array.from({ length: count }, (_, i) => ({
    id: `snap_${i}`,
    createdAt: new Date(Date.now() - i * 60_000).toISOString(),
    source: 'manual' as const,
    status: statuses[i % 3],
    statusScore: statuses[i % 3] === 'ok' ? 1 : 0.5,
    memoryScore: 1,
    notificationScore: 0.75,
    securityScore: 1,
    integrationScore: 0.75,
    schedulerScore: 1,
    runtimeScore: 1,
  }));
  const ok = items.filter(i => i.status === 'ok').length;
  const warning = items.filter(i => i.status === 'warning').length;
  return {
    items,
    summary: { total: count, ok, warning, error: 0 },
  };
}

const noop = async (_f?: SnapshotChartFilters) => {};

describe('ObservabilityCharts', () => {
  it('shows empty state when timeline is null', () => {
    render(
      <ObservabilityCharts
        timeline={null}
        timelineLoading={false}
        timelineError={null}
        onLoadTimeline={noop}
        onExportJson={vi.fn()}
        onExportCsv={vi.fn()}
      />
    );

    expect(screen.getByText(/Aucun snapshot disponible/i)).toBeDefined();
  });

  it('shows empty state when timeline has no items', () => {
    const emptyTimeline: SnapshotTimelineResponse = { items: [], summary: { total: 0, ok: 0, warning: 0, error: 0 } };
    render(
      <ObservabilityCharts
        timeline={emptyTimeline}
        timelineLoading={false}
        timelineError={null}
        onLoadTimeline={noop}
        onExportJson={vi.fn()}
        onExportCsv={vi.fn()}
      />
    );

    expect(screen.getByText(/Aucun snapshot disponible/i)).toBeDefined();
  });

  it('renders charts section when items exist', () => {
    render(
      <ObservabilityCharts
        timeline={makeTimeline(3)}
        timelineLoading={false}
        timelineError={null}
        onLoadTimeline={noop}
        onExportJson={vi.fn()}
        onExportCsv={vi.fn()}
      />
    );

    expect(screen.getByText(/Statut dans le temps/i)).toBeDefined();
    expect(screen.getByText(/Dernier snapshot/i)).toBeDefined();
    expect(screen.getByText(/Tendance notifications/i)).toBeDefined();
    expect(screen.getByText(/Tendance intégrations/i)).toBeDefined();
    expect(screen.getByText(/Historique compact/i)).toBeDefined();
  });

  it('renders summary counts', () => {
    render(
      <ObservabilityCharts
        timeline={makeTimeline(3)}
        timelineLoading={false}
        timelineError={null}
        onLoadTimeline={noop}
        onExportJson={vi.fn()}
        onExportCsv={vi.fn()}
      />
    );

    expect(screen.getByText(/Total/i)).toBeDefined();
  });

  it('renders filter controls', () => {
    render(
      <ObservabilityCharts
        timeline={makeTimeline()}
        timelineLoading={false}
        timelineError={null}
        onLoadTimeline={noop}
        onExportJson={vi.fn()}
        onExportCsv={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /Actualiser/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Export JSON/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Export CSV/i })).toBeDefined();
    expect(screen.getByRole('combobox', { name: /Statut/i })).toBeDefined();
    expect(screen.getByRole('combobox', { name: /Source/i })).toBeDefined();
  });

  it('calls onExportJson when Export JSON is clicked', () => {
    const onExportJson = vi.fn();
    render(
      <ObservabilityCharts
        timeline={makeTimeline()}
        timelineLoading={false}
        timelineError={null}
        onLoadTimeline={noop}
        onExportJson={onExportJson}
        onExportCsv={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Export JSON/i }));
    expect(onExportJson).toHaveBeenCalledTimes(1);
  });

  it('calls onExportCsv when Export CSV is clicked', () => {
    const onExportCsv = vi.fn();
    render(
      <ObservabilityCharts
        timeline={makeTimeline()}
        timelineLoading={false}
        timelineError={null}
        onLoadTimeline={noop}
        onExportJson={vi.fn()}
        onExportCsv={onExportCsv}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Export CSV/i }));
    expect(onExportCsv).toHaveBeenCalledTimes(1);
  });

  it('shows loading state in refresh button', () => {
    render(
      <ObservabilityCharts
        timeline={makeTimeline()}
        timelineLoading={true}
        timelineError={null}
        onLoadTimeline={noop}
        onExportJson={vi.fn()}
        onExportCsv={vi.fn()}
      />
    );
    expect(screen.getByText(/Chargement/i)).toBeDefined();
  });

  it('displays error message when timelineError is set', () => {
    render(
      <ObservabilityCharts
        timeline={makeTimeline()}
        timelineLoading={false}
        timelineError="Erreur de chargement"
        onLoadTimeline={noop}
        onExportJson={vi.fn()}
        onExportCsv={vi.fn()}
      />
    );
    expect(screen.getByText(/Erreur de chargement/i)).toBeDefined();
  });

  it('does not display sensitive data', () => {
    const { container } = render(
      <ObservabilityCharts
        timeline={makeTimeline(3)}
        timelineLoading={false}
        timelineError={null}
        onLoadTimeline={noop}
        onExportJson={vi.fn()}
        onExportCsv={vi.fn()}
      />
    );

    const html = container.innerHTML;
    expect(html).not.toMatch(/Bearer/i);
    expect(html).not.toMatch(/token/i);
    expect(html).not.toMatch(/[A-Za-z]:\\[^\s"]{20,}/);
    expect(html).not.toMatch(/\/var\/[^\s"]{10,}/);
    expect(html).not.toMatch(/\bsnap_\w{8,}\b/);
  });
});

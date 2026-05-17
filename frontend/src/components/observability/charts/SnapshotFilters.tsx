'use client';

import type { SnapshotChartFilters } from '@/lib/types';

interface SnapshotFiltersProps {
  filters: SnapshotChartFilters;
  onChange: (filters: SnapshotChartFilters) => void;
  onRefresh: () => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  loading?: boolean;
}

export function SnapshotFilters({
  filters,
  onChange,
  onRefresh,
  onExportJson,
  onExportCsv,
  loading = false,
}: SnapshotFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-800 border border-gray-700 rounded-lg">
      <select
        aria-label="Limite"
        value={filters.limit ?? 50}
        onChange={e => onChange({ ...filters, limit: Number(e.target.value) })}
        className="bg-gray-900 border border-gray-600 text-gray-100 text-sm rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value={20}>20</option>
        <option value={50}>50</option>
        <option value={100}>100</option>
        <option value={200}>200</option>
      </select>

      <select
        aria-label="Statut"
        value={filters.status ?? ''}
        onChange={e => onChange({ ...filters, status: e.target.value as SnapshotChartFilters['status'] })}
        className="bg-gray-900 border border-gray-600 text-gray-100 text-sm rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Tous statuts</option>
        <option value="ok">OK</option>
        <option value="warning">Warning</option>
        <option value="error">Error</option>
      </select>

      <select
        aria-label="Source"
        value={filters.source ?? ''}
        onChange={e => onChange({ ...filters, source: e.target.value as SnapshotChartFilters['source'] })}
        className="bg-gray-900 border border-gray-600 text-gray-100 text-sm rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Toutes sources</option>
        <option value="manual">Manuel</option>
        <option value="scheduler">Scheduler</option>
        <option value="startup">Démarrage</option>
      </select>

      <button
        onClick={onRefresh}
        disabled={loading}
        className="px-3 py-1 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white text-sm rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-label="Actualiser les graphes"
      >
        {loading ? 'Chargement…' : 'Actualiser'}
      </button>

      <button
        onClick={onExportJson}
        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
      >
        Export JSON
      </button>

      <button
        onClick={onExportCsv}
        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
      >
        Export CSV
      </button>
    </div>
  );
}

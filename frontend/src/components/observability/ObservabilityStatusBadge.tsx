import type { ObservabilityStatus } from '@/lib/types';

interface ObservabilityStatusBadgeProps {
  status: ObservabilityStatus | string;
}

const STATUS_CLASS: Record<ObservabilityStatus, string> = {
  ok: 'border-success/30 bg-success/10 text-emerald-300',
  warning: 'border-warning/30 bg-warning/10 text-yellow-300',
  error: 'border-danger/30 bg-danger/10 text-red-300',
};

const STATUS_LABEL: Record<ObservabilityStatus, string> = {
  ok: 'OK',
  warning: 'Warning',
  error: 'Error',
};

function normalizeStatus(status: string): ObservabilityStatus {
  if (status === 'error') return 'error';
  if (status === 'warning') return 'warning';
  return 'ok';
}

export function ObservabilityStatusBadge({ status }: ObservabilityStatusBadgeProps) {
  const normalized = normalizeStatus(String(status));

  return (
    <span
      className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${STATUS_CLASS[normalized]}`}
    >
      {STATUS_LABEL[normalized]}
    </span>
  );
}

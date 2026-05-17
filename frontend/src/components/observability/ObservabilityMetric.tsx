import { maskSensitiveClientText } from '@/lib/safety';
import { ObservabilityStatusBadge } from './ObservabilityStatusBadge';

interface ObservabilityMetricProps {
  label: string;
  value: unknown;
  detail?: unknown;
  status?: string;
}

export function safeObservabilityText(value: unknown): string {
  if (value === true) return 'Oui';
  if (value === false) return 'Non';
  if (value == null || value === '') return '-';

  return maskSensitiveClientText(String(value))
    .replace(/\bBearer\b/gi, '[auth]')
    .replace(/token/gi, 'secret')
    .slice(0, 160);
}

export function ObservabilityMetric({ label, value, detail, status }: ObservabilityMetricProps) {
  return (
    <div className="min-h-24 rounded-lg border border-white/[0.08] bg-white/[0.03] p-3">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
        {status && <ObservabilityStatusBadge status={status} />}
      </div>
      <p className="mt-3 break-words text-xl font-bold text-slate-100">{safeObservabilityText(value)}</p>
      {detail != null && (
        <p className="mt-1 break-words text-xs text-slate-500">{safeObservabilityText(detail)}</p>
      )}
    </div>
  );
}

'use client';

interface Props {
  status: string;
  className?: string;
}

const BADGE: Record<string, { label: string; className: string }> = {
  valid:      { label: 'Valide',     className: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' },
  corrupted:  { label: 'Corrompu',   className: 'border-red-400/40 bg-red-400/10 text-red-300' },
  incomplete: { label: 'Incomplet',  className: 'border-amber-400/40 bg-amber-400/10 text-amber-300' },
  quick:      { label: 'Quick',      className: 'border-sky-400/40 bg-sky-400/10 text-sky-300' },
  full:       { label: 'Full',       className: 'border-violet-400/40 bg-violet-400/10 text-violet-300' },
  exported:   { label: 'Exporte',    className: 'border-teal-400/40 bg-teal-400/10 text-teal-300' },
  verified:   { label: 'Verifie',    className: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200' },
  unknown:    { label: 'Inconnu',    className: 'border-white/20 bg-white/5 text-slate-400' },
};

export function BackupStatusBadge({ status, className = '' }: Props) {
  const b = BADGE[status] ?? BADGE.unknown;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none ${b.className} ${className}`}
    >
      {b.label}
    </span>
  );
}

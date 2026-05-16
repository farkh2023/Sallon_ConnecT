interface MetricCardProps {
  label:  string;
  value:  string | number;
  icon?:  string;
  sub?:   string;
  color?: string;
}

export function MetricCard({ label, value, icon, sub, color = 'text-slate-100' }: MetricCardProps) {
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 flex flex-col gap-1">
      <span className="text-xs text-slate-500 flex items-center gap-1.5">
        {icon && <span>{icon}</span>}{label}
      </span>
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
      {sub && <span className="text-xs text-slate-600">{sub}</span>}
    </div>
  );
}

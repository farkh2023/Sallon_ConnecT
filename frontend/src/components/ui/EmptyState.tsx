interface EmptyStateProps {
  icon?:     string;
  title:     string;
  message?:  string;
}

export function EmptyState({ icon = '📭', title, message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
      <span className="text-4xl mb-3">{icon}</span>
      <p className="text-sm font-medium text-slate-400">{title}</p>
      {message && <p className="text-xs mt-1">{message}</p>}
    </div>
  );
}

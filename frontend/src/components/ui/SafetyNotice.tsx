interface SafetyNoticeProps {
  children: React.ReactNode;
  icon?:    string;
}

export function SafetyNotice({ children, icon = '🔒' }: SafetyNoticeProps) {
  return (
    <div className="flex gap-2 bg-warning/[0.07] border border-warning/20 rounded-lg px-3 py-2 text-xs text-yellow-300 mt-3">
      <span className="shrink-0">{icon}</span>
      <span>{children}</span>
    </div>
  );
}

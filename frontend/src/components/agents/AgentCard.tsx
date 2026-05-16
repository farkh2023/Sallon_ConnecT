interface AgentCardProps {
  step:  number;
  name:  string;
  role:  string;
  icon?: string;
}

export function AgentCard({ step, name, role, icon = '🤖' }: AgentCardProps) {
  return (
    <div className="flex gap-3 items-start bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
      <div className="flex flex-col items-center gap-1">
        <span className="text-xl">{icon}</span>
        <span className="text-[10px] text-slate-600 font-mono">{step}</span>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-200">{name}</p>
        <p className="text-xs text-slate-500 mt-0.5">{role}</p>
      </div>
    </div>
  );
}

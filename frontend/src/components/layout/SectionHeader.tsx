interface SectionHeaderProps {
  title:       string;
  description?: string;
  icon?:        string;
  badge?:       React.ReactNode;
}

export function SectionHeader({ title, description, icon, badge }: SectionHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-1">
        {icon && <span className="text-2xl">{icon}</span>}
        <h2 className="text-xl font-bold text-slate-100">{title}</h2>
        {badge}
      </div>
      {description && <p className="text-sm text-slate-500 ml-0">{description}</p>}
    </div>
  );
}

type Color = 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'coral';

interface BadgeProps {
  color?:     Color;
  children:   React.ReactNode;
  className?: string;
}

const C: Record<Color, string> = {
  green:  'bg-success/15 text-emerald-400 border-success/25',
  red:    'bg-danger/15 text-red-400 border-danger/25',
  yellow: 'bg-warning/15 text-yellow-400 border-warning/25',
  blue:   'bg-brand/15 text-blue-400 border-brand/25',
  gray:   'bg-white/10 text-slate-400 border-white/15',
  coral:  'bg-coral/15 text-coral border-coral/25',
};

export function Badge({ color = 'gray', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${C[color]} ${className}`}>
      {children}
    </span>
  );
}

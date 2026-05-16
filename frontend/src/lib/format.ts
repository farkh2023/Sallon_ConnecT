export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

export function formatScheduleExpr(s: { type: string; intervalMinutes?: number; time?: string; daysOfWeek?: number[] }): string {
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  if (s.type === 'interval') return `Toutes les ${s.intervalMinutes} min`;
  if (s.type === 'daily')    return `Chaque jour à ${s.time}`;
  if (s.type === 'weekly')   return `${(s.daysOfWeek || []).map(d => days[d]).join(', ')} à ${s.time}`;
  if (s.type === 'manual')   return 'Manuel uniquement';
  return s.type;
}

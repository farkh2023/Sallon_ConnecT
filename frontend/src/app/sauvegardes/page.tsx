import type { Metadata } from 'next';
import { BackupDashboardPanel } from '@/components/backups/BackupDashboardPanel';

export const metadata: Metadata = {
  title: 'Sauvegardes — Sallon-ConnecT',
  description: 'Tableau de bord des sauvegardes locales',
};

export default function SauvegardesPage() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Sauvegardes locales</h1>
        <p className="mt-1 text-sm text-slate-500">
          Gestion des snapshots locaux — 100% local, aucun cloud, aucune restauration automatique
        </p>
      </div>
      <BackupDashboardPanel />
    </main>
  );
}

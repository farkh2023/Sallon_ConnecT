import type { Metadata } from 'next';
import { DashboardWithWidgets } from '@/widgets/layouts/DashboardWithWidgets';

export const metadata: Metadata = {
  title: 'Dashboard — Sallon-ConnecT',
  description: 'Dashboard modulaire avec widgets locaux dynamiques',
};

export default function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Dashboard modulaire</h1>
        <p className="mt-1 text-sm text-slate-500">
          Widgets locaux configurables — 100% local, aucun cloud, aucun script distant
        </p>
      </div>
      <DashboardWithWidgets />
    </main>
  );
}

import type { Metadata } from 'next';
import { WorkspacesPanel } from '@/components/workspaces/WorkspacesPanel';

export const metadata: Metadata = {
  title: 'Workspaces - Sallon-ConnecT',
  description: 'Profils et espaces de travail locaux',
};

export default function WorkspacesPage() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Workspaces locaux</h1>
        <p className="mt-1 text-sm text-slate-500">
          Profils locaux, isolation des donnees IA et layouts dashboard, sans cloud.
        </p>
      </div>
      <WorkspacesPanel />
    </main>
  );
}

import type { Metadata } from 'next';
import { PluginsPanel } from '@/components/plugins/PluginsPanel';

export const metadata: Metadata = {
  title: 'Plugins — Sallon-ConnecT',
  description: 'Extensions locales approuvees manuellement',
};

export default function PluginsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Plugins locaux</h1>
        <p className="mt-1 text-sm text-slate-500">
          Extensions locales approuvees manuellement — 100% local, aucun reseau, aucune installation automatique
        </p>
      </div>
      <PluginsPanel />
    </main>
  );
}

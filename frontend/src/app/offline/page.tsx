import Link from 'next/link';

export const metadata = {
  title: 'Hors connexion | Sallon-ConnecT',
  description: 'Page locale affichee quand le backend ou le reseau est indisponible.',
};

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-navy text-slate-100">
      <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-12">
        <div className="offline-panel">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-300">
            Mode local
          </p>
          <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
            Sallon-ConnecT est hors connexion
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Le backend local ou le reseau domestique est indisponible. Les donnees sensibles ne
            sont pas stockees hors ligne: seules les ressources statiques minimales restent
            accessibles.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="."
              className="rounded-lg border border-brand bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
            >
              R&eacute;essayer
            </a>
            <Link
              href="/"
              className="rounded-lg border border-white/15 bg-white/5 px-5 py-3 text-center text-sm font-semibold text-slate-200 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
            >
              Retour au tableau de bord
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

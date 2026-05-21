import type { Metadata } from 'next';
import { HelpQuickStart } from '@/components/help/HelpQuickStart';
import { HelpCommands } from '@/components/help/HelpCommands';
import { HelpPracticalLabs } from '@/components/help/HelpPracticalLabs';
import { HelpFaq } from '@/components/help/HelpFaq';
import { HelpTroubleshooting } from '@/components/help/HelpTroubleshooting';
import { HelpLinks } from '@/components/help/HelpLinks';
import { HelpSafetyNotice } from '@/components/help/HelpSafetyNotice';
import { HelpTopics } from '@/components/help/HelpTopics';

export const metadata: Metadata = {
  title: 'Centre d\'aide',
  description: 'Centre d\'aide intégré Sallon-ConnecT — commandes, TP, FAQ, dépannage',
};

export default function AidePage() {
  return (
    <main className="min-h-screen bg-[#071A2F] px-4 py-8 text-slate-200">
      <div className="mx-auto max-w-4xl space-y-8">

        {/* Hero */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#0A2540] p-6">
          <div className="mb-1 flex items-center gap-3">
            <span className="text-2xl">🛟</span>
            <h1 className="text-xl font-bold text-slate-100">Centre d&apos;aide Sallon-ConnecT</h1>
          </div>
          <p className="mb-4 text-sm text-slate-400">
            Accès rapide aux commandes, travaux pratiques, FAQ et dépannage. Tout reste local.
          </p>
          <div className="flex flex-wrap gap-2">
            {['Local', 'Sécurisé', 'Aucun cloud', '12 TP guidés'].map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-0.5 text-xs font-medium text-sky-300"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>

        {/* Nav rapide */}
        <nav aria-label="Navigation du Centre d'aide" className="flex flex-wrap gap-2">
          {[
            ['#quick-start', 'Démarrage rapide'],
            ['#sujets', 'Sujets'],
            ['#tp', 'Travaux pratiques'],
            ['#commandes', 'Commandes'],
            ['#faq', 'FAQ'],
            ['#depannage', 'Dépannage'],
            ['#liens', 'Liens & docs'],
            ['#securite', 'Sécurité'],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400 transition hover:border-sky-400/30 hover:text-sky-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Quick start */}
        <section id="quick-start" className="rounded-2xl border border-white/[0.08] bg-[#102A43] p-5">
          <HelpQuickStart />
        </section>

        {/* Sujets */}
        <section id="sujets" className="rounded-2xl border border-white/[0.08] bg-[#102A43] p-5">
          <HelpTopics query="" activeCategory="all" />
        </section>

        {/* TP */}
        <section id="tp" className="rounded-2xl border border-white/[0.08] bg-[#102A43] p-5">
          <HelpPracticalLabs query="" activeCategory="all" />
        </section>

        {/* Commandes */}
        <section id="commandes" className="rounded-2xl border border-white/[0.08] bg-[#102A43] p-5">
          <HelpCommands query="" activeCategory="all" />
        </section>

        {/* FAQ */}
        <section id="faq" className="rounded-2xl border border-white/[0.08] bg-[#102A43] p-5">
          <HelpFaq query="" activeCategory="all" />
        </section>

        {/* Dépannage */}
        <section id="depannage" className="rounded-2xl border border-white/[0.08] bg-[#102A43] p-5">
          <HelpTroubleshooting query="" activeCategory="all" />
        </section>

        {/* Liens */}
        <section id="liens" className="rounded-2xl border border-white/[0.08] bg-[#102A43] p-5">
          <HelpLinks />
        </section>

        {/* Sécurité */}
        <section id="securite" className="rounded-2xl border border-white/[0.08] bg-[#102A43] p-5">
          <HelpSafetyNotice />
        </section>

        <footer className="text-center text-[11px] text-slate-600">
          Sallon-ConnecT v0.1.0 — Centre d&apos;aide local — aucune télémétrie
        </footer>
      </div>
    </main>
  );
}

'use client';

const LINKS = [
  { label: 'Manuel complet SAVOIR_IA', href: '/manuel', badge: 'App', desc: 'Manuel interactif intégré dans le dashboard' },
  { label: 'Manuel interactif HTML', href: '/sallon-connect-manuel-savoir-ia.html', badge: 'HTML', desc: 'Version autonome avec 12 TP et progression' },
  { label: 'Guide utilisateur', href: '/docs/user/README_USER.md', badge: 'Docs', desc: 'Accueil de la documentation utilisateur' },
  { label: 'Dépannage', href: '/docs/user/TROUBLESHOOTING.md', badge: 'Docs', desc: 'Résoudre les problèmes courants' },
  { label: 'FAQ', href: '/docs/user/FAQ.md', badge: 'Docs', desc: 'Réponses aux questions fréquentes' },
  { label: 'Guide Mode TV', href: '/docs/user/TV_MODE_GUIDE.md', badge: 'Docs', desc: 'Plein écran et raccourcis clavier' },
  { label: 'Guide Assistant vocal', href: '/docs/user/VOICE_ASSISTANT_GUIDE.md', badge: 'Docs', desc: 'Commandes vocales locales' },
  { label: 'Guide Sauvegarde', href: '/docs/user/BACKUP_RESTORE_GUIDE.md', badge: 'Docs', desc: 'Backup, dry-run et restauration' },
  { label: 'Guide Observabilité', href: '/docs/user/OBSERVABILITY_GUIDE.md', badge: 'Docs', desc: 'Health, snapshots et graphes' },
  { label: 'Centre d\'aide', href: '/aide', badge: 'App', desc: 'Cette page' },
];

const BADGE_COLORS: Record<string, string> = {
  App: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
  HTML: 'border-purple-400/30 bg-purple-400/10 text-purple-300',
  Docs: 'border-slate-400/20 bg-white/5 text-slate-400',
};

export function HelpLinks() {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Documentation &amp; liens</p>
      {LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          target={link.href.startsWith('/docs') || link.href.endsWith('.html') ? '_blank' : undefined}
          rel={link.href.startsWith('/docs') || link.href.endsWith('.html') ? 'noopener noreferrer' : undefined}
          className="flex items-center justify-between gap-2 rounded-xl border border-white/8 bg-white/3 px-3 py-2.5 text-xs text-slate-300 transition hover:border-sky-400/25 hover:bg-white/6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium text-slate-200">{link.label}</p>
            <p className="text-[11px] text-slate-500">{link.desc}</p>
          </div>
          <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium ${BADGE_COLORS[link.badge] ?? BADGE_COLORS.Docs}`}>
            {link.badge}
          </span>
        </a>
      ))}
    </div>
  );
}

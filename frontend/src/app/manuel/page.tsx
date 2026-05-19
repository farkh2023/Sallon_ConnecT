import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Manuel',
  description: 'Manuel complet Sallon-ConnecT — SAVOIR_IA',
};

export default function ManuelPage() {
  return (
    <main style={{ background: '#071A2F', minHeight: '100vh', color: '#F8FAFC', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>

        {/* Hero */}
        <div style={{
          background: 'linear-gradient(135deg,#0A2540,#0c2d50)',
          border: '1px solid #1E3A5F',
          borderRadius: 16,
          padding: '2rem',
          marginBottom: '2rem',
        }}>
          <h1 style={{ fontSize: '1.7rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Manuel complet{' '}
            <span style={{ color: '#38BDF8' }}>Sallon-ConnecT</span>
          </h1>
          <p style={{ color: '#94A3B8', marginBottom: '1rem' }}>
            Hub local intelligent pour salon connecté — Documentation SAVOIR_IA
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {['Local-first', 'Windows', 'PWA', 'Mode TV', 'Sécurité renforcée'].map(b => (
              <span key={b} style={{
                background: 'rgba(56,189,248,0.1)',
                border: '1px solid rgba(56,189,248,0.3)',
                color: '#38BDF8',
                borderRadius: 20,
                padding: '0.2rem 0.75rem',
                fontSize: '0.78rem',
              }}>{b}</span>
            ))}
          </div>
        </div>

        {/* Full manual link */}
        <div style={{
          background: '#102A43',
          border: '1px solid #1E3A5F',
          borderRadius: 12,
          padding: '1.2rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: '0.3rem' }}>Manuel interactif complet</div>
            <div style={{ color: '#94A3B8', fontSize: '0.85rem' }}>
              Version autonome avec recherche, copie de commandes, 12 travaux pratiques et suivi de progression.
            </div>
          </div>
          <a
            href="/sallon-connect-manuel-savoir-ia.html"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#2563EB',
              color: '#fff',
              borderRadius: 8,
              padding: '0.5rem 1rem',
              textDecoration: 'none',
              fontSize: '0.85rem',
              whiteSpace: 'nowrap',
            }}
          >
            Ouvrir le manuel complet ↗
          </a>
        </div>

        {/* Quick nav */}
        <nav style={{
          background: '#102A43',
          border: '1px solid #1E3A5F',
          borderRadius: 12,
          padding: '1rem 1.2rem',
          marginBottom: '1.5rem',
        }}>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.7rem' }}>
            Navigation rapide
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {[
              ['Installation', '#installation'],
              ['Dashboard', '#dashboard'],
              ['Mode TV', '#mode-tv'],
              ['Assistant vocal', '#assistant-vocal'],
              ['Profils', '#profils'],
              ['Sauvegarde', '#sauvegarde'],
              ['Observabilité', '#observabilite'],
              ['Dépannage', '#depannage'],
              ['FAQ', '#faq'],
              ['Travaux pratiques', '#travaux-pratiques'],
            ].map(([label, href]) => (
              <a key={href} href={href} style={{
                background: '#0D2137',
                border: '1px solid #1E3A5F',
                color: '#94A3B8',
                borderRadius: 20,
                padding: '0.25rem 0.75rem',
                fontSize: '0.8rem',
                textDecoration: 'none',
              }}>{label}</a>
            ))}
          </div>
        </nav>

        {/* Sections inline */}
        {sections.map(({ id, icon, title, content }) => (
          <section key={id} id={id} style={{
            background: '#102A43',
            border: '1px solid #1E3A5F',
            borderRadius: 12,
            marginBottom: '1rem',
            overflow: 'hidden',
          }}>
            <div style={{
              background: '#0D2137',
              borderBottom: '1px solid #1E3A5F',
              padding: '0.85rem 1.2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontWeight: 600,
              fontSize: '1rem',
            }}>
              <span>{icon}</span>
              <span>{title}</span>
            </div>
            <div style={{ padding: '1rem 1.2rem', color: '#94A3B8', fontSize: '0.88rem', lineHeight: 1.7 }}
              dangerouslySetInnerHTML={{ __html: content }} />
          </section>
        ))}

        <footer style={{ textAlign: 'center', color: '#94A3B8', fontSize: '0.75rem', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #1E3A5F' }}>
          Sallon-ConnecT v0.1.0 — Manuel SAVOIR_IA — Local-first, aucune télémétrie
        </footer>
      </div>
    </main>
  );
}

const sections = [
  {
    id: 'installation',
    icon: '⚙️',
    title: '1. Installation',
    content: `
      <p>Installation guidée recommandée depuis la racine du projet :</p>
      <pre style="background:#010f1e;border:1px solid #1E3A5F;border-radius:8px;padding:0.8rem;margin:0.5rem 0;overflow-x:auto;font-family:monospace;font-size:0.82rem;color:#e2e8f0">scripts\\windows\\install\\install-sallon-connect.bat</pre>
      <p>Premier lancement (wizard) :</p>
      <pre style="background:#010f1e;border:1px solid #1E3A5F;border-radius:8px;padding:0.8rem;margin:0.5rem 0;overflow-x:auto;font-family:monospace;font-size:0.82rem;color:#e2e8f0">scripts\\windows\\install\\first-run-wizard.bat</pre>
      <p>Prérequis : <strong style="color:#38BDF8">Windows 10/11 — Node.js 22.13+ — npm — PowerShell — Ports 3000 &amp; 3001 libres</strong></p>
    `,
  },
  {
    id: 'dashboard',
    icon: '🖥️',
    title: '2. Dashboard',
    content: `
      <p>Démarrer et ouvrir le dashboard :</p>
      <pre style="background:#010f1e;border:1px solid #1E3A5F;border-radius:8px;padding:0.8rem;margin:0.5rem 0;overflow-x:auto;font-family:monospace;font-size:0.82rem;color:#e2e8f0">scripts\\windows\\start-sallon-connect.bat
scripts\\windows\\open-dashboard.bat</pre>
      <p>URLs locales : <strong style="color:#38BDF8">http://localhost:3000</strong> (backend) · <strong style="color:#38BDF8">http://localhost:3001</strong> (frontend)</p>
      <p>Sections disponibles : Hub · Appareils · Agents · Médias · Scénarios · Notifications · Observabilité · Tâches · Profils · Sauvegarde</p>
    `,
  },
  {
    id: 'mode-tv',
    icon: '📺',
    title: '3. Mode TV',
    content: `
      <p>Cliquer <strong style="color:#F8FAFC">Mode TV</strong> dans la barre du haut, ou appuyer sur <kbd style="background:#0A2540;border:1px solid #1E3A5F;border-radius:4px;padding:0.1rem 0.4rem;font-family:monospace;color:#38BDF8">T</kbd>. Plein écran avec <kbd style="background:#0A2540;border:1px solid #1E3A5F;border-radius:4px;padding:0.1rem 0.4rem;font-family:monospace;color:#38BDF8">F</kbd>.</p>
      <p>Autres raccourcis : <kbd style="background:#0A2540;border:1px solid #1E3A5F;border-radius:4px;padding:0.1rem 0.4rem;font-family:monospace;color:#38BDF8">R</kbd> Actualiser · <kbd style="background:#0A2540;border:1px solid #1E3A5F;border-radius:4px;padding:0.1rem 0.4rem;font-family:monospace;color:#38BDF8">N</kbd> Notifications · <kbd style="background:#0A2540;border:1px solid #1E3A5F;border-radius:4px;padding:0.1rem 0.4rem;font-family:monospace;color:#38BDF8">S</kbd> Tâches · <kbd style="background:#0A2540;border:1px solid #1E3A5F;border-radius:4px;padding:0.1rem 0.4rem;font-family:monospace;color:#38BDF8">H</kbd> Observabilité</p>
      <p style="background:rgba(239,68,68,0.08);border-left:3px solid #EF4444;border-radius:0 6px 6px 0;padding:0.5rem 0.8rem;color:#fca5a5">🔒 Aucun raccourci ne lance de commande sensible.</p>
    `,
  },
  {
    id: 'assistant-vocal',
    icon: '🎤',
    title: '4. Assistant Vocal',
    content: `
      <p>Cliquer <strong style="color:#F8FAFC">Assistant vocal</strong> → <strong style="color:#F8FAFC">Micro</strong>. L'écoute ne démarre jamais automatiquement.</p>
      <p>Commandes disponibles : navigation (ouvre le hub…), actualise, scanne le statut, mode TV, plein écran, statut du système.</p>
      <p style="background:rgba(239,68,68,0.08);border-left:3px solid #EF4444;border-radius:0 6px 6px 0;padding:0.5rem 0.8rem;color:#fca5a5">🔒 Bloquées : commandes TV · SmartThings · streaming · restauration · suppression audit</p>
      <p>Aucun cloud — pas d'OpenAI, Google Cloud, Azure ou Firebase. Fallback texte disponible.</p>
    `,
  },
  {
    id: 'profils',
    icon: '👤',
    title: '5. Profils',
    content: `
      <p>Profils disponibles : <strong style="color:#38BDF8">Principal</strong> (admin) · <strong style="color:#38BDF8">Famille</strong> (standard) · <strong style="color:#38BDF8">Invité</strong> (lecture seule) · <strong style="color:#38BDF8">TV</strong> (réduit) · <strong style="color:#38BDF8">Diagnostic</strong> (technique).</p>
      <p style="background:rgba(239,68,68,0.08);border-left:3px solid #EF4444;border-radius:0 6px 6px 0;padding:0.5rem 0.8rem;color:#fca5a5">🔒 Un profil ne contourne jamais les garde-fous backend.</p>
    `,
  },
  {
    id: 'sauvegarde',
    icon: '💾',
    title: '6. Sauvegarde',
    content: `
      <p>Créer une sauvegarde depuis la section <strong style="color:#F8FAFC">Sauvegarde</strong> du dashboard, ou via l'API :</p>
      <pre style="background:#010f1e;border:1px solid #1E3A5F;border-radius:8px;padding:0.8rem;margin:0.5rem 0;overflow-x:auto;font-family:monospace;font-size:0.82rem;color:#e2e8f0">Invoke-RestMethod -Method POST http://localhost:3000/api/backup/create</pre>
      <p style="background:rgba(239,68,68,0.08);border-left:3px solid #EF4444;border-radius:0 6px 6px 0;padding:0.5rem 0.8rem;color:#fca5a5">🔒 Dry-run obligatoire avant toute restauration. Sans confirmation explicite, la restauration est refusée.</p>
    `,
  },
  {
    id: 'observabilite',
    icon: '📊',
    title: '7. Observabilité',
    content: `
      <p>Créer un snapshot et consulter la timeline :</p>
      <pre style="background:#010f1e;border:1px solid #1E3A5F;border-radius:8px;padding:0.8rem;margin:0.5rem 0;overflow-x:auto;font-family:monospace;font-size:0.82rem;color:#e2e8f0">Invoke-RestMethod -Method POST http://localhost:3000/api/observability/snapshots
Invoke-RestMethod http://localhost:3000/api/observability/snapshots/timeline</pre>
      <p>Blocs : health backend · sécurité · runtime · logs · tests · intégrations · snapshots · graphes temporels.</p>
    `,
  },
  {
    id: 'depannage',
    icon: '🔧',
    title: '8. Dépannage rapide',
    content: `
      <ul style="padding-left:1.3rem">
        <li>Port 3000 occupé → <code style="background:#010f1e;padding:0.1rem 0.3rem;border-radius:4px">scripts\\windows\\stop-sallon-connect.bat</code></li>
        <li>PowerShell bloque → <code style="background:#010f1e;padding:0.1rem 0.3rem;border-radius:4px">-ExecutionPolicy Bypass</code></li>
        <li>Node trop ancien → Installer Node.js 22.13+</li>
        <li>PWA ne s'installe pas → Utiliser Chrome ou Edge sur http://localhost:3001</li>
        <li>Restore refusé → Lancer un dry-run d'abord</li>
        <li>Raccourcis absents → <code style="background:#010f1e;padding:0.1rem 0.3rem;border-radius:4px">scripts\\windows\\install\\repair-sallon-connect.bat</code></li>
      </ul>
    `,
  },
  {
    id: 'faq',
    icon: '❓',
    title: '9. FAQ',
    content: `
      <ul style="padding-left:1.3rem">
        <li><strong style="color:#F8FAFC">Données cloud ?</strong> Non — local-first uniquement.</li>
        <li><strong style="color:#F8FAFC">SmartThings obligatoire ?</strong> Non — opt-in.</li>
        <li><strong style="color:#F8FAFC">ADB lit mes photos ?</strong> Non — lecture seule, diagnostic uniquement.</li>
        <li><strong style="color:#F8FAFC">Streaming automatique ?</strong> Non — assisté et protégé.</li>
        <li><strong style="color:#F8FAFC">Assistant vocal cloud ?</strong> Non — Web Speech API locale uniquement.</li>
        <li><strong style="color:#F8FAFC">.env écrasé par l'installateur ?</strong> Non — conservé s'il existe.</li>
      </ul>
    `,
  },
  {
    id: 'travaux-pratiques',
    icon: '🎓',
    title: '10. Travaux pratiques (aperçu)',
    content: `
      <p>12 travaux pratiques guidés sont disponibles dans le <a href="/sallon-connect-manuel-savoir-ia.html" target="_blank" style="color:#38BDF8">manuel interactif complet</a> :</p>
      <ol style="padding-left:1.3rem;line-height:2">
        <li>Installer Sallon-ConnecT</li>
        <li>Lancer le dashboard</li>
        <li>Vérifier la santé du système</li>
        <li>Configurer la Box SFR</li>
        <li>Tester le réseau local</li>
        <li>Activer DLNA</li>
        <li>Utiliser le Mode TV</li>
        <li>Utiliser l'assistant vocal</li>
        <li>Créer une sauvegarde locale</li>
        <li>Vérifier une sauvegarde</li>
        <li>Observer le système</li>
        <li>Préparer une release propre</li>
      </ol>
    `,
  },
];

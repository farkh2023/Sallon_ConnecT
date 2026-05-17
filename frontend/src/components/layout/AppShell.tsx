'use client';

import { useNotifications } from '@/hooks/useNotifications';
import { useTvMode } from '@/hooks/useTvMode';
import { TopNav } from './TopNav';
import { SectionHeader } from './SectionHeader';
import { HeroPanel } from '@/components/dashboard/HeroPanel';
import { DevicesPanel } from '@/components/devices/DevicesPanel';
import { AgentsPanel } from '@/components/agents/AgentsPanel';
import { MediaPanel } from '@/components/media/MediaPanel';
import { AdbPanel } from '@/components/media/AdbPanel';
import { DlnaPanel } from '@/components/media/DlnaPanel';
import { SmartThingsPanel } from '@/components/media/SmartThingsPanel';
import { StreamingPanel } from '@/components/media/StreamingPanel';
import { ScenariosPanel } from '@/components/scenarios/ScenariosPanel';
import { NotificationsPanel } from '@/components/notifications/NotificationsPanel';
import { SchedulerPanel } from '@/components/scheduler/SchedulerPanel';
import { ObservabilityPanel } from '@/components/observability/ObservabilityPanel';
import { ProfilesPanel } from '@/components/profiles/ProfilesPanel';
import { TvModeProvider } from '@/components/tv/TvModeProvider';
import { TvDashboard } from '@/components/tv/TvDashboard';
import { useProfiles } from '@/hooks/useProfiles';
import { useEffect } from 'react';

export function AppShell() {
  return (
    <TvModeProvider>
      <AppShellContent />
    </TvModeProvider>
  );
}

function AppShellContent() {
  const { stats } = useNotifications(15_000);
  const tv = useTvMode();
  const unread = stats?.unread ?? 0;
  const { profiles, activeProfile, loadProfiles, loadActiveProfile, activateProfile } = useProfiles();

  useEffect(() => {
    void loadProfiles();
    void loadActiveProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleActivateProfile = async (id: string) => {
    await activateProfile(id);
    await loadActiveProfile();
  };

  const sectionClass = (panel: string) =>
    tv.enabled && tv.activePanel === panel ? 'tv-active-section' : undefined;

  return (
    <div className={`flex min-h-screen flex-col ${tv.enabled ? 'tv-mode-shell' : ''}`}>
      <TopNav
        unread={unread}
        profiles={profiles}
        activeProfile={activeProfile}
        onActivateProfile={id => void handleActivateProfile(id)}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-16 px-4 py-8">
        {tv.enabled && <TvDashboard />}

        <section id="hero" className={sectionClass('dashboard')}>
          <HeroPanel />
        </section>

        <section id="appareils">
          <SectionHeader
            icon="TV"
            title="Appareils"
            description="Statut reseau en temps reel de vos appareils configures"
          />
          <DevicesPanel />
        </section>

        <section id="agents">
          <SectionHeader
            icon="AI"
            title="Hub-Agent Workflow"
            description="Les 6 agents specialises du salon connecte"
          />
          <AgentsPanel />
        </section>

        <section id="media" className={sectionClass('media')}>
          <SectionHeader
            icon="AV"
            title="Centre multimedia"
            description="Services et integrations locales"
          />
          <div className="space-y-6">
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
                Services
              </p>
              <MediaPanel />
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
                  ADB Diagnostic
                </p>
                <AdbPanel />
              </div>
              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
                  DLNA / UPnP
                </p>
                <DlnaPanel />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
                  SmartThings Samsung TV
                </p>
                <SmartThingsPanel />
              </div>
              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
                  Streaming assiste
                </p>
                <StreamingPanel />
              </div>
            </div>
          </div>
        </section>

        <section id="scenarios">
          <SectionHeader
            icon="SC"
            title="Scenarios intelligents"
            description="Automatisations locales, mode simulation par defaut"
          />
          <ScenariosPanel />
        </section>

        <section id="notifications" className={sectionClass('notifications')}>
          <SectionHeader
            icon="NO"
            title="Notifications"
            description="Centre de notifications local, aucun push cloud"
            badge={
              unread > 0 ? (
                <span className="rounded-full bg-danger px-2 py-0.5 text-[10px] font-bold leading-none text-white">
                  {unread}
                </span>
              ) : undefined
            }
          />
          <NotificationsPanel />
        </section>

        <section id="observabilite" className={sectionClass('observability')}>
          <SectionHeader
            icon="OB"
            title="Observabilite"
            description="Tableau local de health, securite, runtime, logs et tests"
          />
          <ObservabilityPanel />
        </section>

        <section id="taches" className={sectionClass('scheduler')}>
          <SectionHeader
            icon="TS"
            title="Taches planifiees"
            description="Scheduler local, aucun cron systeme, aucun cloud"
          />
          <SchedulerPanel />
        </section>

        <section id="profils">
          <SectionHeader
            icon="PR"
            title="Profils locaux"
            description="Personnalisation et permissions par profil — 100% local, aucun cloud"
          />
          <ProfilesPanel />
        </section>
      </main>

      <footer className="border-t border-white/[0.06] py-4 text-center text-xs text-slate-600">
        Sallon-ConnecT Phase 20 - local, securise, aucun cloud
      </footer>
    </div>
  );
}

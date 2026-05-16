'use client';

import { useNotifications } from '@/hooks/useNotifications';
import { TopNav } from './TopNav';
import { SectionHeader } from './SectionHeader';
import { HeroPanel }          from '@/components/dashboard/HeroPanel';
import { DevicesPanel }       from '@/components/devices/DevicesPanel';
import { AgentsPanel }        from '@/components/agents/AgentsPanel';
import { MediaPanel }         from '@/components/media/MediaPanel';
import { AdbPanel }           from '@/components/media/AdbPanel';
import { DlnaPanel }          from '@/components/media/DlnaPanel';
import { SmartThingsPanel }   from '@/components/media/SmartThingsPanel';
import { StreamingPanel }     from '@/components/media/StreamingPanel';
import { ScenariosPanel }     from '@/components/scenarios/ScenariosPanel';
import { NotificationsPanel } from '@/components/notifications/NotificationsPanel';
import { SchedulerPanel }     from '@/components/scheduler/SchedulerPanel';

export function AppShell() {
  const { stats } = useNotifications(15_000);
  const unread    = stats?.unread ?? 0;

  return (
    <div className="flex flex-col min-h-screen">
      <TopNav unread={unread} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 space-y-16">

        {/* Hero */}
        <section id="hero">
          <HeroPanel />
        </section>

        {/* Appareils */}
        <section id="appareils">
          <SectionHeader icon="📡" title="Appareils" description="Statut réseau en temps réel de vos appareils configurés" />
          <DevicesPanel />
        </section>

        {/* Agents */}
        <section id="agents">
          <SectionHeader icon="🤖" title="Hub-Agent Workflow" description="Les 6 agents spécialisés du salon connecté" />
          <AgentsPanel />
        </section>

        {/* Centre multimédia */}
        <section id="media">
          <SectionHeader icon="🎬" title="Centre multimédia" description="Services et intégrations locales" />
          <div className="space-y-6">
            <div>
              <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wider">Services</p>
              <MediaPanel />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wider">ADB Diagnostic</p>
                <AdbPanel />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wider">DLNA / UPnP</p>
                <DlnaPanel />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wider">SmartThings Samsung TV</p>
                <SmartThingsPanel />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wider">Streaming assisté</p>
                <StreamingPanel />
              </div>
            </div>
          </div>
        </section>

        {/* Scénarios */}
        <section id="scenarios">
          <SectionHeader icon="🎭" title="Scénarios intelligents" description="Automatisations locales — mode simulation par défaut" />
          <ScenariosPanel />
        </section>

        {/* Notifications */}
        <section id="notifications">
          <SectionHeader
            icon="🔔"
            title="Notifications"
            description="Centre de notifications local — aucun push cloud"
            badge={unread > 0 ? (
              <span className="bg-danger text-white text-[10px] font-bold rounded-full px-2 py-0.5 leading-none">
                {unread}
              </span>
            ) : undefined}
          />
          <NotificationsPanel />
        </section>

        {/* Tâches planifiées */}
        <section id="taches">
          <SectionHeader icon="📅" title="Tâches planifiées" description="Scheduler local — aucun cron système, aucun cloud" />
          <SchedulerPanel />
        </section>

      </main>

      <footer className="border-t border-white/[0.06] text-center py-4 text-xs text-slate-600">
        Sallon-ConnecT Phase 14 — local, sécurisé, aucun cloud
      </footer>
    </div>
  );
}

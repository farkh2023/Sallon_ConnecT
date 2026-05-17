import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppShell } from '@/components/layout/AppShell';

vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: () => ({ stats: { unread: 0 } }),
}));

vi.mock('@/components/layout/TopNav', () => ({
  TopNav: () => <nav>TopNav</nav>,
}));

vi.mock('@/components/dashboard/HeroPanel', () => ({ HeroPanel: () => <div>Hero panel</div> }));
vi.mock('@/components/devices/DevicesPanel', () => ({ DevicesPanel: () => <div>Devices panel</div> }));
vi.mock('@/components/agents/AgentsPanel', () => ({ AgentsPanel: () => <div>Agents panel</div> }));
vi.mock('@/components/media/MediaPanel', () => ({ MediaPanel: () => <div>Media panel</div> }));
vi.mock('@/components/media/AdbPanel', () => ({ AdbPanel: () => <div>ADB panel</div> }));
vi.mock('@/components/media/DlnaPanel', () => ({ DlnaPanel: () => <div>DLNA panel</div> }));
vi.mock('@/components/media/SmartThingsPanel', () => ({ SmartThingsPanel: () => <div>SmartThings panel</div> }));
vi.mock('@/components/media/StreamingPanel', () => ({ StreamingPanel: () => <div>Streaming panel</div> }));
vi.mock('@/components/scenarios/ScenariosPanel', () => ({ ScenariosPanel: () => <div>Scenarios panel</div> }));
vi.mock('@/components/notifications/NotificationsPanel', () => ({ NotificationsPanel: () => <div>Notifications panel</div> }));
vi.mock('@/components/scheduler/SchedulerPanel', () => ({ SchedulerPanel: () => <div>Scheduler panel</div> }));
vi.mock('@/components/tv/TvDashboard', () => ({ TvDashboard: () => <div>TV dashboard</div> }));

describe('AppShell', () => {
  it('renders the main dashboard sections', () => {
    render(<AppShell />);

    expect(screen.getByText('TopNav')).toBeInTheDocument();
    expect(screen.getByText('Appareils')).toBeInTheDocument();
    expect(screen.getByText('Hub-Agent Workflow')).toBeInTheDocument();
    expect(screen.getByText('Centre multimedia')).toBeInTheDocument();
    expect(screen.getByText('Scenarios intelligents')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Taches planifiees')).toBeInTheDocument();
  });
});

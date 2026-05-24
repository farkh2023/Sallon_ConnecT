'use client';

// Import en side-effect : enregistre tous les widgets système avant le premier render.
import '@/widgets/registry/widgetRegistrations';
import { DashboardLayout } from './DashboardLayout';

interface Props {
  profileId?: string;
}

export function DashboardWithWidgets({ profileId }: Props) {
  return <DashboardLayout profileId={profileId} />;
}

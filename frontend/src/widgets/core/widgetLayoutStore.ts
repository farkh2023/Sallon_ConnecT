import type { SavedDashboardLayout } from './widgetTypes';
import { workspaceScopedKey } from '@/lib/workspaceStorage';

const STORAGE_KEY = 'sallon-connect-widget-layout-v1';

function hasStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function keyFor(workspaceId?: string | null): string {
  return workspaceScopedKey(STORAGE_KEY, workspaceId);
}

export function saveLayout(layout: SavedDashboardLayout, workspaceId?: string | null): void {
  try {
    if (!hasStorage()) return;
    localStorage.setItem(keyFor(workspaceId), JSON.stringify(layout));
  } catch {
    // write non bloquante
  }
}

export function loadLayout(workspaceId?: string | null): SavedDashboardLayout | null {
  try {
    if (!hasStorage()) return null;
    const raw = localStorage.getItem(keyFor(workspaceId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedDashboardLayout;
    if (!Array.isArray(parsed.widgets)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function exportLayoutJson(layout: SavedDashboardLayout): string {
  return JSON.stringify(layout, null, 2);
}

export function importLayoutJson(json: string): SavedDashboardLayout | null {
  try {
    const parsed = JSON.parse(json) as SavedDashboardLayout;
    if (!Array.isArray(parsed.widgets)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearLayout(workspaceId?: string | null): void {
  try {
    if (!hasStorage()) return;
    localStorage.removeItem(keyFor(workspaceId));
  } catch {
    // non bloquant
  }
}

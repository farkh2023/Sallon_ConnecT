'use client';

const WORKSPACE_ID_RE = /^[a-zA-Z0-9_-]{1,40}$/;

export const DEFAULT_WORKSPACE_ID = 'default';
export const CURRENT_WORKSPACE_STORAGE_KEY = 'sallon-connect-current-workspace';
export const WORKSPACE_CHANGED_EVENT = 'sallon-connect-workspace-changed';

function hasStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function normalizeWorkspaceId(id: string | null | undefined): string {
  if (!id || !WORKSPACE_ID_RE.test(id)) return DEFAULT_WORKSPACE_ID;
  return id;
}

export function getStoredWorkspaceId(): string {
  try {
    if (!hasStorage()) return DEFAULT_WORKSPACE_ID;
    return normalizeWorkspaceId(localStorage.getItem(CURRENT_WORKSPACE_STORAGE_KEY));
  } catch {
    return DEFAULT_WORKSPACE_ID;
  }
}

export function setStoredWorkspaceId(id: string | null | undefined): void {
  const normalized = normalizeWorkspaceId(id);
  try {
    if (hasStorage()) localStorage.setItem(CURRENT_WORKSPACE_STORAGE_KEY, normalized);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(WORKSPACE_CHANGED_EVENT, { detail: { workspaceId: normalized } }));
    }
  } catch {
    // non blocking
  }
}

export function workspaceScopedKey(baseKey: string, workspaceId?: string | null): string {
  const id = normalizeWorkspaceId(workspaceId || getStoredWorkspaceId());
  return id === DEFAULT_WORKSPACE_ID ? baseKey : `${baseKey}:${id}`;
}

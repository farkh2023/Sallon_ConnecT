'use client';

import { useCallback, useRef, useState } from 'react';
import { apiDelete, apiPatch, apiPost, buildApiUrl, handleApiError } from '@/lib/api';
import type {
  UserProfile,
  ProfilePermissions,
  ProfileSafety,
  ProfileAuditEntry,
  ProfileActionCheckResult,
} from '@/lib/types';

interface UseProfilesState {
  profiles: UserProfile[];
  activeProfile: UserProfile | null;
  profilesLoading: boolean;
  profilesError: string | null;
  auditEntries: ProfileAuditEntry[];
  auditLoading: boolean;
  loadProfiles: () => Promise<void>;
  loadActiveProfile: () => Promise<void>;
  createProfile: (input: Partial<UserProfile>) => Promise<UserProfile | null>;
  updateProfile: (id: string, patch: Partial<UserProfile>) => Promise<UserProfile | null>;
  deleteProfile: (id: string) => Promise<boolean>;
  activateProfile: (id: string) => Promise<UserProfile | null>;
  loadProfilePermissions: (id: string) => Promise<{ permissions: ProfilePermissions; safety: ProfileSafety } | null>;
  checkProfileAction: (id: string, actionType: string) => Promise<ProfileActionCheckResult | null>;
  loadProfileAudit: () => Promise<void>;
  clearProfileAudit: () => Promise<void>;
}

export function useProfiles(): UseProfilesState {
  const mountedRef = useRef(true);

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profilesError, setProfilesError] = useState<string | null>(null);
  const [auditEntries, setAuditEntries] = useState<ProfileAuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const loadProfiles = useCallback(async () => {
    if (typeof window === 'undefined') return;
    setProfilesLoading(true);
    setProfilesError(null);
    try {
      const res = await fetch(buildApiUrl('/api/profiles'), { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { profiles: UserProfile[]; total: number };
      if (mountedRef.current) setProfiles(json.profiles || []);
    } catch (err) {
      if (mountedRef.current) setProfilesError(handleApiError(err));
    } finally {
      if (mountedRef.current) setProfilesLoading(false);
    }
  }, []);

  const loadActiveProfile = useCallback(async () => {
    if (typeof window === 'undefined') return;
    try {
      const res = await fetch(buildApiUrl('/api/profiles/active'), { cache: 'no-store' });
      if (!res.ok) return;
      const json = (await res.json()) as UserProfile;
      if (mountedRef.current) setActiveProfile(json);
    } catch { /* silent */ }
  }, []);

  const createProfile = useCallback(async (input: Partial<UserProfile>): Promise<UserProfile | null> => {
    if (typeof window === 'undefined') return null;
    setProfilesLoading(true);
    setProfilesError(null);
    try {
      const profile = await apiPost<UserProfile>('/api/profiles', input);
      if (mountedRef.current) setProfiles(prev => [...prev, profile]);
      return profile;
    } catch (err) {
      if (mountedRef.current) setProfilesError(handleApiError(err));
      return null;
    } finally {
      if (mountedRef.current) setProfilesLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (id: string, patch: Partial<UserProfile>): Promise<UserProfile | null> => {
    if (typeof window === 'undefined') return null;
    setProfilesLoading(true);
    setProfilesError(null);
    try {
      const updated = await apiPatch<UserProfile>(`/api/profiles/${id}`, patch);
      if (mountedRef.current) {
        setProfiles(prev => prev.map(p => p.id === id ? updated : p));
        if (activeProfile?.id === id) setActiveProfile(updated);
      }
      return updated;
    } catch (err) {
      if (mountedRef.current) setProfilesError(handleApiError(err));
      return null;
    } finally {
      if (mountedRef.current) setProfilesLoading(false);
    }
  }, [activeProfile]);

  const deleteProfile = useCallback(async (id: string): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    setProfilesLoading(true);
    setProfilesError(null);
    try {
      await apiDelete(`/api/profiles/${id}`);
      if (mountedRef.current) setProfiles(prev => prev.filter(p => p.id !== id));
      return true;
    } catch (err) {
      if (mountedRef.current) setProfilesError(handleApiError(err));
      return false;
    } finally {
      if (mountedRef.current) setProfilesLoading(false);
    }
  }, []);

  const activateProfile = useCallback(async (id: string): Promise<UserProfile | null> => {
    if (typeof window === 'undefined') return null;
    setProfilesLoading(true);
    setProfilesError(null);
    try {
      const res = await apiPost<{ status: string; active: UserProfile }>(`/api/profiles/${id}/activate`);
      if (mountedRef.current && res.active) setActiveProfile(res.active);
      return res.active ?? null;
    } catch (err) {
      if (mountedRef.current) setProfilesError(handleApiError(err));
      return null;
    } finally {
      if (mountedRef.current) setProfilesLoading(false);
    }
  }, []);

  const loadProfilePermissions = useCallback(async (id: string) => {
    if (typeof window === 'undefined') return null;
    try {
      const res = await fetch(buildApiUrl(`/api/profiles/${id}/permissions`), { cache: 'no-store' });
      if (!res.ok) return null;
      return (await res.json()) as { permissions: ProfilePermissions; safety: ProfileSafety };
    } catch {
      return null;
    }
  }, []);

  const checkProfileAction = useCallback(async (id: string, actionType: string): Promise<ProfileActionCheckResult | null> => {
    if (typeof window === 'undefined') return null;
    try {
      const result = await apiPost<ProfileActionCheckResult>(`/api/profiles/${id}/check-action`, { actionType });
      return result;
    } catch {
      return null;
    }
  }, []);

  const loadProfileAudit = useCallback(async () => {
    if (typeof window === 'undefined') return;
    setAuditLoading(true);
    try {
      const res = await fetch(buildApiUrl('/api/profiles/audit'), { cache: 'no-store' });
      if (!res.ok) return;
      const json = (await res.json()) as { entries: ProfileAuditEntry[] };
      if (mountedRef.current) setAuditEntries(json.entries || []);
    } catch { /* silent */ } finally {
      if (mountedRef.current) setAuditLoading(false);
    }
  }, []);

  const clearProfileAudit = useCallback(async () => {
    if (typeof window === 'undefined') return;
    try {
      await apiDelete('/api/profiles/audit');
      if (mountedRef.current) setAuditEntries([]);
    } catch { /* silent */ }
  }, []);

  return {
    profiles,
    activeProfile,
    profilesLoading,
    profilesError,
    auditEntries,
    auditLoading,
    loadProfiles,
    loadActiveProfile,
    createProfile,
    updateProfile,
    deleteProfile,
    activateProfile,
    loadProfilePermissions,
    checkProfileAction,
    loadProfileAudit,
    clearProfileAudit,
  };
}

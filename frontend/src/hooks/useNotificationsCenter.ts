'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  clearNotifications,
  getNotifications,
  getUnreadCount,
  initNotificationCenter,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotificationCenter,
} from '@/lib/notificationCenter';
import type { LocalNotification, LocalNotificationFilter } from '@/lib/types';

interface UseNotificationsCenterState {
  notifications: LocalNotification[];
  filteredNotifications: LocalNotification[];
  unreadCount: number;
  filter: LocalNotificationFilter;
  browserPermission: NotificationPermission;
  setFilter: (f: Partial<LocalNotificationFilter>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  requestBrowserPermission: () => Promise<void>;
}

const DEFAULT_FILTER: LocalNotificationFilter = { severity: 'all', source: 'all' };

function applyFilter(
  notifs: LocalNotification[],
  filter: LocalNotificationFilter,
): LocalNotification[] {
  return notifs.filter((n) => {
    const bySev = filter.severity === 'all' || n.severity === filter.severity;
    const bySrc = filter.source === 'all' || n.source === filter.source;
    return bySev && bySrc;
  });
}

function getBrowserPermission(): NotificationPermission {
  if (typeof Notification === 'undefined') return 'default';
  return Notification.permission;
}

export function useNotificationsCenter(): UseNotificationsCenterState {
  const [notifications, setNotifications] = useState<LocalNotification[]>(getNotifications);
  const [unreadCount, setUnreadCount] = useState(getUnreadCount);
  const [filter, setFilterState] = useState<LocalNotificationFilter>(DEFAULT_FILTER);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(
    getBrowserPermission,
  );

  useEffect(() => {
    initNotificationCenter();
    const unsub = subscribeToNotificationCenter(() => {
      setNotifications([...getNotifications()]);
      setUnreadCount(getUnreadCount());
    });
    return unsub;
  }, []);

  const setFilter = useCallback((partial: Partial<LocalNotificationFilter>) => {
    setFilterState((prev) => ({ ...prev, ...partial }));
  }, []);

  const markAsRead = useCallback((id: string) => {
    markNotificationRead(id);
  }, []);

  const markAllAsRead = useCallback(() => {
    markAllNotificationsRead();
  }, []);

  const clearAll = useCallback(() => {
    clearNotifications();
  }, []);

  const requestBrowserPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    const perm = await Notification.requestPermission();
    setBrowserPermission(perm);
  }, []);

  const filteredNotifications = applyFilter(notifications, filter);

  return {
    notifications,
    filteredNotifications,
    unreadCount,
    filter,
    browserPermission,
    setFilter,
    markAsRead,
    markAllAsRead,
    clearAll,
    requestBrowserPermission,
  };
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  clearAllEvents,
  emitSystemEvent,
  exportEventsCsv,
  exportEventsJson,
  getEvents,
  getUnreadCount,
  markAllEventsRead,
  markEventRead,
  subscribeToEventBus,
} from '@/lib/systemEventBus';
import { isStorageAvailable } from '@/lib/systemEventStorage';
import type { SystemEvent, SystemEventFilter } from '@/lib/types';

interface UseSystemEventsState {
  events: SystemEvent[];
  filteredEvents: SystemEvent[];
  unreadCount: number;
  filter: SystemEventFilter;
  storageAvailable: boolean;
  setFilter: (f: Partial<SystemEventFilter>) => void;
  addEvent: typeof emitSystemEvent;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearEvents: () => void;
  exportJson: () => void;
  exportCsv: () => void;
}

const DEFAULT_FILTER: SystemEventFilter = { severity: 'all', source: 'all' };

function applyFilter(events: SystemEvent[], filter: SystemEventFilter): SystemEvent[] {
  return events.filter((e) => {
    const bySeverity = filter.severity === 'all' || e.severity === filter.severity;
    const bySource = filter.source === 'all' || e.source === filter.source;
    return bySeverity && bySource;
  });
}

export function useSystemEvents(): UseSystemEventsState {
  const [events, setEvents] = useState<SystemEvent[]>(getEvents());
  const [unreadCount, setUnreadCount] = useState(getUnreadCount());
  const [filter, setFilterState] = useState<SystemEventFilter>(DEFAULT_FILTER);
  const [storageAvailable] = useState(isStorageAvailable);

  useEffect(() => {
    const unsub = subscribeToEventBus(() => {
      setEvents([...getEvents()]);
      setUnreadCount(getUnreadCount());
    });
    return unsub;
  }, []);

  const setFilter = useCallback((partial: Partial<SystemEventFilter>) => {
    setFilterState((prev) => ({ ...prev, ...partial }));
  }, []);

  const markRead = useCallback((id: string) => {
    markEventRead(id);
  }, []);

  const markAllRead = useCallback(() => {
    markAllEventsRead();
  }, []);

  const clearEvents = useCallback(() => {
    clearAllEvents();
  }, []);

  const exportJson = useCallback(() => {
    if (typeof window !== 'undefined') exportEventsJson();
  }, []);

  const exportCsv = useCallback(() => {
    if (typeof window !== 'undefined') exportEventsCsv();
  }, []);

  const filteredEvents = applyFilter(events, filter);

  return {
    events,
    filteredEvents,
    unreadCount,
    filter,
    storageAvailable,
    setFilter,
    addEvent: emitSystemEvent,
    markRead,
    markAllRead,
    clearEvents,
    exportJson,
    exportCsv,
  };
}

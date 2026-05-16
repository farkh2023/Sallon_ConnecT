'use client';

import { useCallback, useEffect, useState } from 'react';
import type { PwaInstallState } from '@/lib/types';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches;
}

export function useInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [state, setState] = useState<PwaInstallState>(() =>
    isStandaloneDisplay() ? 'installed' : 'unsupported'
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isStandaloneDisplay()) return;

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
      setState('available');
    };

    const onAppInstalled = () => {
      setPromptEvent(null);
      setState('installed');
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!promptEvent) return;

    setState('prompting');
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    setPromptEvent(null);
    setState(choice.outcome === 'accepted' ? 'installed' : 'dismissed');
  }, [promptEvent]);

  const dismiss = useCallback(() => {
    setPromptEvent(null);
    setState('dismissed');
  }, []);

  return {
    state,
    canInstall: state === 'available' && promptEvent !== null,
    promptInstall,
    dismiss,
  };
}

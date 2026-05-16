'use client';

import { useEffect } from 'react';

type ShortcutHandlers = Record<string, (event: KeyboardEvent) => void>;

interface KeyboardShortcutOptions {
  enabled?: boolean;
  ignoreEditable?: boolean;
}

function normalizeKey(key: string): string {
  if (key.length === 1) return key.toLowerCase();
  return key;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable;
}

export function useKeyboardShortcuts(
  handlers: ShortcutHandlers,
  options: KeyboardShortcutOptions = {}
) {
  const { enabled = true, ignoreEditable = true } = options;

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (ignoreEditable && isEditableTarget(event.target)) return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;

      const handler = handlers[normalizeKey(event.key)];
      if (!handler) return;

      event.preventDefault();
      handler(event);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, handlers, ignoreEditable]);
}

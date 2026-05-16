'use client';

import { KeyboardEvent, useRef, useState } from 'react';
import type { TvQuickAction } from '@/lib/types';

interface TvFocusGridProps {
  actions: TvQuickAction[];
}

export function TvFocusGrid({ actions }: TvFocusGridProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const currentIndex = actions.length === 0 ? 0 : Math.min(selectedIndex, actions.length - 1);

  function move(delta: number) {
    if (actions.length === 0) return;
    setSelectedIndex((current) => {
      const next = (current + delta + actions.length) % actions.length;
      window.requestAnimationFrame(() => buttonRefs.current[next]?.focus());
      return next;
    });
  }

  function runAction(action: TvQuickAction) {
    if (action.disabled || !action.safe) return;
    action.onRun();
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (actions.length === 0) return;

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      move(1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      move(-1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      move(2);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      move(-2);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      runAction(actions[currentIndex]);
    }
  }

  return (
    <div className="tv-focus-grid" role="grid" aria-label="Actions rapides TV" onKeyDown={onKeyDown}>
      {actions.map((action, index) => (
        <button
          key={action.id}
          ref={(node) => {
            buttonRefs.current[index] = node;
          }}
          type="button"
          role="gridcell"
          tabIndex={index === currentIndex ? 0 : -1}
          disabled={action.disabled || !action.safe}
          onFocus={() => setSelectedIndex(index)}
          onClick={() => runAction(action)}
          className="tv-action-button"
        >
          <span className="text-lg font-bold text-slate-100">{action.label}</span>
          {action.shortcut && <span className="tv-shortcut">{action.shortcut}</span>}
          {action.description && <span className="text-sm text-slate-400">{action.description}</span>}
        </button>
      ))}
    </div>
  );
}

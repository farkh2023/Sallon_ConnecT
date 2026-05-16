'use client';

import React from 'react';

interface NavLink { href: string; label: string; badge?: number }

const NAV_LINKS: NavLink[] = [
  { href: '#hero',          label: 'Hub'         },
  { href: '#appareils',     label: 'Appareils'   },
  { href: '#agents',        label: 'Agents'      },
  { href: '#media',         label: 'Médias'      },
  { href: '#scenarios',     label: 'Scénarios'   },
  { href: '#notifications', label: 'Notifs'      },
  { href: '#taches',        label: 'Tâches'      },
];

interface TopNavProps { unread?: number }

export function TopNav({ unread = 0 }: TopNavProps) {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-navy/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <span className="font-bold text-slate-100 tracking-wide shrink-0">
          🏠 Sallon-ConnecT
        </span>
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {NAV_LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors whitespace-nowrap"
            >
              {link.label}
              {link.href === '#notifications' && unread > 0 && (
                <span className="bg-danger text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </a>
          ))}
        </div>
        <span className="text-xs text-slate-600 shrink-0 hidden sm:block">Phase 14</span>
      </div>
    </nav>
  );
}

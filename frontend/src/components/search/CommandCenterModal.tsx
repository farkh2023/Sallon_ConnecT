'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useGlobalSearch }     from '@/hooks/useGlobalSearch';
import { GlobalSearchBox }     from './GlobalSearchBox';
import { SearchResultsList }   from './SearchResultsList';
import { CommandPreviewPanel } from './CommandPreviewPanel';
import { RecentSearches }      from './RecentSearches';
import { SavedCommands }       from './SavedCommands';
import type { SearchResult, SearchCommand, CommandRunResponse } from '@/lib/types';

interface CommandCenterModalProps {
  open:    boolean;
  onClose: () => void;
}

export function CommandCenterModal({ open, onClose }: CommandCenterModalProps) {
  const {
    results, groups, commands, history, loading, error,
    query, setQuery, search, previewCommand, runCommand, clearHistory,
  } = useGlobalSearch();

  const [selectedIndex,    setSelectedIndex]    = useState(-1);
  const [previewedCommand, setPreviewedCommand] = useState<SearchCommand | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ctrl+K / Escape handling
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); if (!open) return; }
      if (e.key === 'Escape' && open) { onClose(); setPreviewedCommand(null); }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Keyboard navigation
  useEffect(() => {
    function handleNav(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, -1)); }
      if (e.key === 'Enter' && selectedIndex >= 0) {
        const item = results[selectedIndex];
        if (item) void handleResultSelect(item, selectedIndex);
      }
    }
    document.addEventListener('keydown', handleNav);
    return () => document.removeEventListener('keydown', handleNav);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, results, selectedIndex]);

  // Debounced live search
  const handleQueryChange = useCallback((v: string) => {
    setQuery(v);
    setSelectedIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (v.trim().length >= 2) {
      debounceRef.current = setTimeout(() => void search(v.trim()), 300);
    }
  }, [setQuery, search]);

  async function handleResultSelect(result: SearchResult, idx: number) {
    setSelectedIndex(idx);
    if (result.type === 'command' && result._commandId) {
      const preview = await previewCommand(result._commandId);
      setPreviewedCommand(preview);
    } else if (result.target) {
      window.location.href = result.target;
      onClose();
    }
  }

  async function handleCommandSelect(cmd: SearchCommand) {
    const preview = await previewCommand(cmd.id);
    setPreviewedCommand(preview);
  }

  const handleRun = useCallback(async (id: string): Promise<CommandRunResponse | null> => {
    return runCommand(id);
  }, [runCommand]);

  function handleHistorySelect(q: string) {
    setQuery(q);
    void search(q);
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-label="Command Center"
      aria-modal="true"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '10vh',
      }}
    >
      <div
        style={{
          width: '100%', maxWidth: 620,
          background: '#0f0f1a', borderRadius: 10,
          border: '1px solid #2a2a4e',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
          overflow: 'hidden',
        }}
      >
        {/* Search input */}
        <GlobalSearchBox
          value={query}
          onChange={handleQueryChange}
          onSearch={q => void search(q)}
          loading={loading}
          autoFocus
        />

        {/* Badge */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '4px 14px', gap: 8 }}>
          <span style={{ fontSize: 10, color: '#4ade80', background: '#0d2818', border: '1px solid #166534', borderRadius: 4, padding: '1px 6px' }}>
            Recherche locale uniquement
          </span>
          {error && <span style={{ fontSize: 10, color: '#f87171' }}>{error}</span>}
        </div>

        {/* Results or home */}
        {query.trim().length >= 2 ? (
          <SearchResultsList
            groups={groups}
            results={results}
            selected={selectedIndex}
            onSelect={handleResultSelect}
            loading={loading}
            query={query}
          />
        ) : (
          <div>
            <RecentSearches history={history} onSelect={handleHistorySelect} onClear={clearHistory} />
            <SavedCommands commands={commands} onSelect={handleCommandSelect} />
          </div>
        )}

        {/* Command preview */}
        {previewedCommand && (
          <CommandPreviewPanel command={previewedCommand} onRun={handleRun} onClose={() => { setPreviewedCommand(null); onClose(); }} />
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 14px', borderTop: '1px solid #1a1a2e', fontSize: 10, color: '#444' }}>
          <span>↑↓ naviguer · Entree selectionner · Echap fermer</span>
          <span>Ctrl+K ouvrir</span>
        </div>
      </div>
    </div>
  );
}

'use client';

interface CommandShortcutHintProps {
  shortcut?: string;
}

export function CommandShortcutHint({ shortcut = 'Ctrl+K' }: CommandShortcutHintProps) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#666' }}>
      <kbd style={{ background: '#1e1e3f', border: '1px solid #444', borderRadius: 3, padding: '1px 5px', fontFamily: 'monospace', fontSize: 10 }}>
        {shortcut.split('+')[0]}
      </kbd>
      <span>+</span>
      <kbd style={{ background: '#1e1e3f', border: '1px solid #444', borderRadius: 3, padding: '1px 5px', fontFamily: 'monospace', fontSize: 10 }}>
        {shortcut.split('+')[1]}
      </kbd>
    </span>
  );
}

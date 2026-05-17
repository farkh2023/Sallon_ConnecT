'use client';

import { Button } from '@/components/ui/Button';

interface VoiceButtonProps {
  isSupported: boolean;
  isListening: boolean;
  onToggle: () => void;
}

export function VoiceButton({ isSupported, isListening, onToggle }: VoiceButtonProps) {
  return (
    <Button
      type="button"
      onClick={onToggle}
      disabled={!isSupported}
      variant={isListening ? 'success' : 'primary'}
      className={isListening ? 'ring-2 ring-emerald-400/40' : ''}
    >
      <span className={isListening ? 'inline-block h-2 w-2 rounded-full bg-emerald-300 animate-pulse' : 'inline-block h-2 w-2 rounded-full bg-slate-300'} />
      {isListening ? 'Arreter' : 'Micro'}
    </Button>
  );
}

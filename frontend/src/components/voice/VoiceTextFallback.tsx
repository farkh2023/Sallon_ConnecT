'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/Button';

interface VoiceTextFallbackProps {
  onSubmit: (text: string) => Promise<unknown>;
}

export function VoiceTextFallback({ onSubmit }: VoiceTextFallbackProps) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const text = value.trim();
    if (!text) return;
    setBusy(true);
    await onSubmit(text);
    setBusy(false);
    setValue('');
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Ex. ouvre les appareils"
        className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-100 outline-none focus:border-coral"
      />
      <Button type="submit" loading={busy}>Envoyer</Button>
    </form>
  );
}

import type { Metadata } from 'next';
import { AiAssistantPanel } from '@/components/ai/AiAssistantPanel';

export const metadata: Metadata = {
  title: 'IA locale — Sallon-ConnecT',
  description: 'Assistant IA local propulse par Ollama — 100% local, aucun cloud.',
};

export default function AiPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <AiAssistantPanel />
    </main>
  );
}

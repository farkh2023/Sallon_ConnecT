'use client';

interface Props {
  diagnostic: Record<string, unknown> | null;
}

export function BackupDiagnosticPanel({ diagnostic }: Props) {
  if (!diagnostic) return null;

  return (
    <details className="rounded-xl border border-white/[0.08] bg-[#0A2540] p-4">
      <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-300">
        Diagnostic technique
      </summary>
      <pre className="mt-3 max-h-48 overflow-auto text-xs text-slate-400">
        {JSON.stringify(diagnostic, null, 2)}
      </pre>
    </details>
  );
}

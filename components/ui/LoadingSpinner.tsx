'use client';

import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ size = 24, label }: { size?: number, label?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <Loader2 size={size} color="var(--accent-cyan)" style={{ animation: 'spin 1s linear infinite' }} />
      {label && <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{label}</span>}
    </div>
  );
}

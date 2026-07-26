'use client';

import { AlertCircle, X } from 'lucide-react';

export function ErrorBanner({ message, onDismiss }: { message: string, onDismiss?: () => void }) {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'flex-start',
      padding: '12px 16px',
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      borderRadius: '8px',
      color: 'var(--error)',
      marginBottom: '20px'
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <AlertCircle size={18} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 14 }}>{message}</span>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 4 }}>
          <X size={16} />
        </button>
      )}
    </div>
  );
}

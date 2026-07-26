'use client';

import { useWallet } from '@/hooks/useWallet';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';

export function BalanceDisplay() {
  const { balance, refreshBalance } = useWallet();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshBalance();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 12,
      padding: '8px 16px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '100px',
    }}>
      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Balance:</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
        {balance ? `${parseFloat(balance).toFixed(2)} XLM` : '...'}
      </span>
      <button 
        onClick={handleRefresh}
        style={{ 
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', color: 'var(--text-muted)'
        }}
        disabled={isRefreshing}
      >
        <RefreshCw size={14} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
      </button>
    </div>
  );
}

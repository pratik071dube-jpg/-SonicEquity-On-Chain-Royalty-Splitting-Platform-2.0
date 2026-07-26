'use client';

import { ReactNode } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { WalletButton } from './WalletButton';
import { ShieldAlert } from 'lucide-react';

export function NetworkGuard({ children }: { children: ReactNode }) {
  const { isConnected, network } = useWallet();

  if (!isConnected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: 20, textAlign: 'center' }}>
        <ShieldAlert size={48} color="var(--text-muted)" style={{ marginBottom: 20 }} />
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Wallet Disconnected</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32, maxWidth: 400 }}>
          You need to connect your Freighter wallet to access this area.
        </p>
        <WalletButton size="lg" />
      </div>
    );
  }

  if (network && !network.toUpperCase().includes('TESTNET')) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: 20, textAlign: 'center' }}>
        <ShieldAlert size={48} color="var(--warning)" style={{ marginBottom: 20 }} />
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Wrong Network</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32, maxWidth: 400 }}>
          Please switch your Freighter wallet to the Stellar Testnet.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

'use client';

import { useWallet } from '@/hooks/useWallet';
import { shortenAddress } from '@/lib/stellar';
import { LogOut, Wallet } from 'lucide-react';

export function WalletButton({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const { isConnected, publicKey, connect, disconnect, isLoading, isFreighterInstalled } = useWallet();

  if (!isFreighterInstalled) {
    return (
      <a 
        href="https://freighter.app" 
        target="_blank" 
        rel="noopener noreferrer" 
        style={{ textDecoration: 'none' }}
      >
        <button className="btn btn-secondary" style={{ padding: size === 'lg' ? '14px 32px' : undefined }}>
          Install Freighter
        </button>
      </a>
    );
  }

  if (isConnected && publicKey) {
    return (
      <button 
        className="btn btn-secondary" 
        onClick={disconnect}
        title="Disconnect Wallet"
        style={{ padding: size === 'lg' ? '14px 32px' : undefined }}
      >
        <Wallet size={16} color="var(--accent-cyan)" />
        {shortenAddress(publicKey)}
        <LogOut size={14} style={{ marginLeft: 4 }} color="var(--text-muted)" />
      </button>
    );
  }

  return (
    <button 
      className="btn btn-primary" 
      onClick={connect}
      disabled={isLoading}
      style={{ padding: size === 'lg' ? '14px 32px' : undefined }}
    >
      <Wallet size={16} />
      {isLoading ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}

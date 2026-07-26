'use client';

import { ReactNode } from 'react';
import { WalletContext, useWalletState } from '@/hooks/useWallet';

export function WalletProvider({ children }: { children: ReactNode }) {
  const walletState = useWalletState();

  return (
    <WalletContext.Provider value={walletState}>
      {children}
    </WalletContext.Provider>
  );
}

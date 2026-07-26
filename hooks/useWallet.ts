'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as StellarSdk from '@stellar/stellar-sdk';
import {
  connectWallet,
  getWalletState,
  isFreighterInstalled as checkFreighterInstalled,
  signTransaction as signTransactionFreighter,
} from '@/lib/freighter';
import { getXlmBalance } from '@/lib/stellar';
import { parseError } from '@/lib/errors';

export interface WalletContextValue {
  isConnected: boolean;
  publicKey: string | null;
  network: string | null;
  balance: string | null;
  balanceXlm: string | null;
  isLoading: boolean;
  isFreighterInstalled: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
  signTransaction: (xdr: string) => Promise<string>;
}

const DEFAULT_WALLET_STATE: WalletContextValue = {
  isConnected: false,
  publicKey: null,
  network: null,
  balance: null,
  balanceXlm: null,
  isLoading: false,
  isFreighterInstalled: false,
  connect: async () => {},
  disconnect: () => {},
  refreshBalance: async () => {},
  signTransaction: async () => {
    throw parseError(new Error('No wallet connected'));
  },
};

export const WalletContext = createContext<WalletContextValue>(DEFAULT_WALLET_STATE);

/** Access the shared wallet connection state provided by WalletProvider. */
export function useWallet(): WalletContextValue {
  return useContext(WalletContext);
}

/** Builds the wallet state consumed by WalletContext.Provider — one instance per app. */
export function useWalletState(): WalletContextValue {
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [freighterInstalled, setFreighterInstalled] = useState(false);

  const refreshBalance = useCallback(async (address?: string | null) => {
    const key = address ?? publicKey;
    if (!key) return;
    try {
      const xlm = await getXlmBalance(key);
      setBalance(xlm);
    } catch (err) {
      console.error('Failed to refresh balance:', parseError(err));
    }
  }, [publicKey]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const installed = await checkFreighterInstalled();
      if (cancelled) return;
      setFreighterInstalled(installed);
      if (!installed) return;

      const state = await getWalletState();
      if (cancelled) return;
      setIsConnected(state.isConnected);
      setPublicKey(state.publicKey);
      setNetwork(state.network);
      if (state.isConnected && state.publicKey) {
        void refreshBalance(state.publicKey);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connect = useCallback(async () => {
    setIsLoading(true);
    try {
      const address = await connectWallet();
      const state = await getWalletState();
      setIsConnected(true);
      setPublicKey(address);
      setNetwork(state.network);
      await refreshBalance(address);
    } finally {
      setIsLoading(false);
    }
  }, [refreshBalance]);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setPublicKey(null);
    setNetwork(null);
    setBalance(null);
  }, []);

  const signTransaction = useCallback(
    async (xdr: string) => signTransactionFreighter(xdr, StellarSdk.Networks.TESTNET),
    [],
  );

  return {
    isConnected,
    publicKey,
    network,
    balance,
    balanceXlm: balance,
    isLoading,
    isFreighterInstalled: freighterInstalled,
    connect,
    disconnect,
    refreshBalance: () => refreshBalance(),
    signTransaction,
  };
}

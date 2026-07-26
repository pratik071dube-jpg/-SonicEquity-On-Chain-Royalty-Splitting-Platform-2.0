/**
 * Freighter wallet integration utilities.
 * Uses latest @stellar/freighter-api signatures with typed error handling.
 */
import {
  isConnected,
  requestAccess,
  getAddress,
  getNetwork,
  signTransaction as signTxFreighter,
} from '@stellar/freighter-api';
import { createError } from './errors';

export interface WalletState {
  publicKey: string | null;
  isConnected: boolean;
  network: string | null;
}

/** Check if Freighter extension is installed in the browser. */
export async function isFreighterInstalled(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const result = await isConnected();
    return result.isConnected === true;
  } catch {
    return false;
  }
}

/** Get the current connection state from Freighter. */
export async function getWalletState(): Promise<WalletState> {
  if (typeof window === 'undefined') {
    return { publicKey: null, isConnected: false, network: null };
  }

  try {
    const connected = await isConnected();
    if (!connected.isConnected) {
      return { publicKey: null, isConnected: false, network: null };
    }

    const [addrResult, netResult] = await Promise.all([
      getAddress(),
      getNetwork(),
    ]);

    return {
      publicKey: addrResult && 'address' in addrResult && addrResult.address ? addrResult.address : null,
      isConnected: true,
      network: netResult && 'network' in netResult && netResult.network ? netResult.network : null,
    };
  } catch (err) {
    console.error('Failed to get wallet state:', err);
    return { publicKey: null, isConnected: false, network: null };
  }
}

/** Connect to Freighter and return the public key. */
export async function connectWallet(): Promise<string> {
  const installed = await isFreighterInstalled();
  if (!installed) {
    throw createError('wallet', 'FREIGHTER_NOT_INSTALLED');
  }

  const result = await requestAccess();
  if (result && 'error' in result && result.error) {
    throw createError('wallet', 'USER_REJECTED', String(result.error));
  }

  if (result && 'address' in result && result.address) {
    return result.address;
  }

  throw createError('wallet', 'USER_REJECTED', 'No address returned from wallet');
}

/** Sign a transaction XDR string via Freighter. */
export async function signTransaction(
  xdr: string,
  networkPassphrase?: string,
): Promise<string> {
  const result = await signTxFreighter(xdr, { networkPassphrase });
  if (result && 'error' in result && result.error) {
    throw createError('wallet', 'USER_REJECTED', String(result.error));
  }
  if (result && 'signedTxXdr' in result && result.signedTxXdr) {
    return result.signedTxXdr;
  }
  throw createError('wallet', 'USER_REJECTED', 'No signed XDR returned');
}

/** Validate that the wallet is on the expected network. */
export async function validateNetwork(expectedNetwork: string): Promise<void> {
  const netResult = await getNetwork();
  const network = netResult && 'network' in netResult ? netResult.network : null;
  if (!network || !network.toUpperCase().includes(expectedNetwork.toUpperCase())) {
    throw createError(
      'wallet',
      'WRONG_NETWORK',
      `Expected ${expectedNetwork}, got ${network ?? 'unknown'}`,
    );
  }
}

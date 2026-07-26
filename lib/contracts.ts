/**
 * Soroban contract interaction utilities.
 * Handles track registration, payment distribution, and status polling.
 */
import * as StellarSdk from '@stellar/stellar-sdk';
import { createError } from './errors';
import { isValidStellarAddress } from './stellar';

export const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;
const SOROBAN_RPC_URL = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ?? 'https://soroban-testnet.stellar.org';

export interface Split {
  address: string;
  share_bps: number; // basis points: 10000 = 100%
}

export interface ContractCallResult {
  txHash: string;
  status: 'pending' | 'submitted' | 'confirmed' | 'failed';
}

/** Validate splits client-side before submitting to contract. */
export function validateSplits(splits: Split[]): void {
  if (splits.length === 0) {
    throw createError('validation', 'EMPTY_SPLITS');
  }
  for (const split of splits) {
    if (!isValidStellarAddress(split.address)) {
      throw createError('validation', 'INVALID_ADDRESS', `Invalid address: ${split.address}`);
    }
    if (split.share_bps <= 0) {
      throw createError('validation', 'ZERO_SHARE', `Zero share for ${split.address}`);
    }
  }
  const total = splits.reduce((sum, s) => sum + s.share_bps, 0);
  if (total !== 10_000) {
    throw createError(
      'validation',
      'SPLITS_NOT_100',
      `Total is ${total} bps, expected 10000`,
    );
  }
}

/** Convert percentage (0-100) to basis points. */
export function percentageToBps(pct: number): number {
  return Math.round(pct * 100);
}

/** Convert basis points to percentage string. */
export function bpsToPercentage(bps: number): string {
  return (bps / 100).toFixed(2) + '%';
}

/** Get a Soroban RPC server. */
function getRpc(): StellarSdk.rpc.Server {
  return new StellarSdk.rpc.Server(SOROBAN_RPC_URL, { allowHttp: false });
}

/**
 * Call a Soroban contract method.
 * Handles simulation, fee estimation, signing, and submission.
 */
export async function callContract(
  contractId: string,
  method: string,
  args: StellarSdk.xdr.ScVal[],
  sourcePublicKey: string,
  signFn: (xdr: string) => Promise<string>,
): Promise<ContractCallResult> {
  const rpc = getRpc();
  const account = await rpc.getAccount(sourcePublicKey);

  const contract = new StellarSdk.Contract(contractId);

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: '100000', // 0.01 XLM max fee
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  // Simulate to get footprint and fee
  const simResult = await rpc.simulateTransaction(tx);
  if (StellarSdk.rpc.Api.isSimulationError(simResult)) {
    throw createError(
      'network',
      'SIMULATION_FAILED',
      simResult.error,
    );
  }

  const preparedTx = StellarSdk.rpc.assembleTransaction(
    tx,
    simResult,
  ).build();

  // Sign via Freighter
  const signedXdr = await signFn(preparedTx.toXDR());
  const signedTx = StellarSdk.TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);

  // Submit
  const sendResult = await rpc.sendTransaction(signedTx);
  if (sendResult.status === 'ERROR') {
    throw createError('contract', 'CONTRACT_REVERT', sendResult.errorResult?.toXDR('base64'));
  }

  return {
    txHash: sendResult.hash,
    status: 'submitted',
  };
}

/** Poll a Soroban transaction until it is confirmed or failed. */
export async function pollSorobanTx(
  txHash: string,
  onStatusChange?: (status: ContractCallResult['status']) => void,
  maxAttempts = 30,
  intervalMs = 2000,
): Promise<'confirmed' | 'failed'> {
  const rpc = getRpc();
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise<void>((resolve) => setTimeout(resolve, intervalMs));
    const status = await rpc.getTransaction(txHash);
    if (status.status === StellarSdk.rpc.Api.GetTransactionStatus.SUCCESS) {
      onStatusChange?.('confirmed');
      return 'confirmed';
    }
    if (status.status === StellarSdk.rpc.Api.GetTransactionStatus.FAILED) {
      onStatusChange?.('failed');
      return 'failed';
    }
  }
  onStatusChange?.('failed');
  return 'failed';
}

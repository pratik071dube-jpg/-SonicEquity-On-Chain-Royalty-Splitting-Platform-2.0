/**
 * Stellar SDK utilities for building and submitting transactions.
 * Uses @stellar/stellar-sdk v13.x (compatible with Node 18+).
 */
import * as StellarSdk from '@stellar/stellar-sdk';
import { createError, parseError } from './errors';

const TESTNET_RPC_URL = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ?? 'https://soroban-testnet.stellar.org';
const HORIZON_URL = process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL ?? 'https://horizon-testnet.stellar.org';
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;

/** Get a Soroban RPC server instance. */
export function getRpcServer(): StellarSdk.rpc.Server {
  return new StellarSdk.rpc.Server(TESTNET_RPC_URL, { allowHttp: false });
}

/** Get a Horizon server instance. */
export function getHorizonServer(): StellarSdk.Horizon.Server {
  return new StellarSdk.Horizon.Server(HORIZON_URL, { allowHttp: false });
}

/** Fetch the XLM balance for a given Stellar address. */
export async function getXlmBalance(publicKey: string): Promise<string> {
  try {
    const server = getHorizonServer();
    const account = await server.loadAccount(publicKey);
    const nativeBalance = account.balances.find(
      (b: { asset_type: string }) => b.asset_type === 'native',
    );
    return nativeBalance ? (nativeBalance as { balance: string }).balance : '0';
  } catch (err) {
    throw parseError(err);
  }
}

/** Send a native XLM payment. */
export async function sendXlmPayment(
  sourcePublicKey: string,
  destinationAddress: string,
  amountXlm: string,
  signFn: (xdr: string) => Promise<string>,
): Promise<{ txHash: string; ledger: number }> {
  const server = getHorizonServer();
  const account = await server.loadAccount(sourcePublicKey);

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: destinationAddress,
        asset: StellarSdk.Asset.native(),
        amount: amountXlm,
      }),
    )
    .setTimeout(30)
    .build();

  const signedXdr = await signFn(tx.toXDR());
  const signedTx = StellarSdk.TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);

  const result = await server.submitTransaction(signedTx);
  if (!result.successful) {
    throw createError('contract', 'CONTRACT_REVERT', 'Transaction failed on-chain');
  }

  return {
    txHash: result.hash,
    ledger: result.ledger,
  };
}

/** Poll transaction status until confirmed or failed. */
export async function pollTransactionStatus(
  txHash: string,
  maxAttempts = 30,
  intervalMs = 2000,
): Promise<'confirmed' | 'failed'> {
  const server = getRpcServer();
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise<void>((resolve) => setTimeout(resolve, intervalMs));
    const status = await server.getTransaction(txHash);
    if (status.status === StellarSdk.rpc.Api.GetTransactionStatus.SUCCESS) {
      return 'confirmed';
    }
    if (status.status === StellarSdk.rpc.Api.GetTransactionStatus.FAILED) {
      return 'failed';
    }
  }
  return 'failed';
}

/** Format a stroop amount to XLM with 7 decimal places. */
export function stroopsToXlm(stroops: number | string): string {
  const amount = typeof stroops === 'string' ? parseInt(stroops, 10) : stroops;
  return (amount / 10_000_000).toFixed(7);
}

/** Convert XLM to stroops (integer). */
export function xlmToStroops(xlm: number | string): number {
  const amount = typeof xlm === 'string' ? parseFloat(xlm) : xlm;
  return Math.floor(amount * 10_000_000);
}

/** Validate a Stellar G-address. */
export function isValidStellarAddress(address: string): boolean {
  try {
    StellarSdk.Keypair.fromPublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/** Shorten an address for display. */
export function shortenAddress(address: string, chars = 6): string {
  if (address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/** Build Stellar Expert testnet transaction link. */
export function stellarExpertTxLink(txHash: string): string {
  return `https://stellar.expert/explorer/testnet/tx/${txHash}`;
}

/** Build Stellar Expert testnet contract link. */
export function stellarExpertContractLink(contractId: string): string {
  return `https://stellar.expert/explorer/testnet/contract/${contractId}`;
}

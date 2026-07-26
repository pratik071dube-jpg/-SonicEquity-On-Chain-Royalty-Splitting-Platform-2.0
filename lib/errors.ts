/**
 * Strongly-typed error categories for the StellarSplit frontend.
 * Each category maps to specific user-facing messages and internal codes.
 */

export type ErrorCategory = 'wallet' | 'contract' | 'validation' | 'network';

export interface AppError {
  category: ErrorCategory;
  code: string;
  userMessage: string;
  technicalMessage?: string;
}

/** Error codes — typed string unions to prevent stringly-typed mistakes. */
export type ErrorCode =
  // Wallet errors (Level 2 requirement: distinct error type 1)
  | 'FREIGHTER_NOT_INSTALLED'
  | 'WALLET_NOT_CONNECTED'
  | 'WRONG_NETWORK'
  | 'USER_REJECTED'
  // Contract errors (Level 2 requirement: distinct error type 2)
  | 'CONTRACT_REVERT'
  | 'CONTRACT_INVALID_SPLITS'
  | 'CONTRACT_UNAUTHORIZED'
  | 'CONTRACT_ALREADY_EXISTS'
  | 'CONTRACT_NOT_FOUND'
  // Validation errors (Level 2 requirement: distinct error type 3)
  | 'INVALID_ADDRESS'
  | 'SPLITS_NOT_100'
  | 'EMPTY_SPLITS'
  | 'ZERO_SHARE'
  | 'INVALID_AMOUNT'
  // Network errors
  | 'NETWORK_TIMEOUT'
  | 'NETWORK_UNAVAILABLE'
  | 'SIMULATION_FAILED';

/** Create a typed AppError. */
export function createError(
  category: ErrorCategory,
  code: ErrorCode,
  technicalMessage?: string,
): AppError {
  return {
    category,
    code,
    userMessage: USER_MESSAGES[code] ?? 'An unexpected error occurred.',
    technicalMessage,
  };
}

/** User-facing messages for each error code. */
const USER_MESSAGES: Record<ErrorCode, string> = {
  // Wallet
  FREIGHTER_NOT_INSTALLED:
    'Freighter wallet is not installed. Please install it from freighter.app and refresh.',
  WALLET_NOT_CONNECTED:
    'No wallet connected. Please connect your Freighter wallet to continue.',
  WRONG_NETWORK:
    'Wrong network selected. Please switch Freighter to Stellar Testnet.',
  USER_REJECTED:
    'Transaction was rejected. Please approve the request in Freighter to continue.',
  // Contract
  CONTRACT_REVERT:
    'The smart contract rejected this transaction. Please check your inputs and try again.',
  CONTRACT_INVALID_SPLITS:
    'Invalid split configuration. Verify all collaborator addresses and ensure percentages sum to 100%.',
  CONTRACT_UNAUTHORIZED:
    'You are not authorized to perform this action on this contract.',
  CONTRACT_ALREADY_EXISTS:
    'A track with this ID already exists. Please choose a different track name.',
  CONTRACT_NOT_FOUND:
    'The track contract was not found on-chain. It may not have been deployed yet.',
  // Validation
  INVALID_ADDRESS:
    'Invalid Stellar address. Addresses must start with G and be 56 characters long.',
  SPLITS_NOT_100:
    'Percentages must sum to exactly 100%. Please adjust the collaborator splits.',
  EMPTY_SPLITS:
    'At least one collaborator is required.',
  ZERO_SHARE:
    'Each collaborator must have a share greater than 0%.',
  INVALID_AMOUNT:
    'Payment amount must be greater than 0 XLM.',
  // Network
  NETWORK_TIMEOUT:
    'The request timed out. The Stellar network may be congested — please try again.',
  NETWORK_UNAVAILABLE:
    'Cannot reach the Stellar network. Please check your internet connection.',
  SIMULATION_FAILED:
    'Transaction simulation failed. The contract may not be deployed correctly.',
};

/** Parse an unknown error into an AppError. */
export function parseError(err: unknown): AppError {
  if (err instanceof Object && 'category' in err) {
    return err as AppError;
  }

  const message = err instanceof Error ? err.message : String(err);

  if (message.toLowerCase().includes('freighter')) {
    return createError('wallet', 'FREIGHTER_NOT_INSTALLED', message);
  }
  if (message.toLowerCase().includes('rejected') || message.toLowerCase().includes('denied')) {
    return createError('wallet', 'USER_REJECTED', message);
  }
  if (message.toLowerCase().includes('network') || message.toLowerCase().includes('fetch')) {
    return createError('network', 'NETWORK_UNAVAILABLE', message);
  }
  if (message.toLowerCase().includes('simulation')) {
    return createError('network', 'SIMULATION_FAILED', message);
  }

  return {
    category: 'network',
    code: 'NETWORK_UNAVAILABLE',
    userMessage: message || 'An unexpected error occurred.',
    technicalMessage: message,
  };
}

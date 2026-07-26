//! Core data types for the royalty-split contract.

use soroban_sdk::{contracttype, Address, String};

/// A single collaborator's share of a track's royalties.
/// `share_bps` is in basis points (1/10_000), so 10_000 = 100%.
#[contracttype]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Split {
    /// The collaborator's Stellar address.
    pub address: Address,
    /// Share in basis points (1–10_000). Must sum to 10_000 across all splits.
    pub share_bps: u32,
}

/// Persistent storage keys for the contract.
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    /// The track identifier (immutable after init).
    TrackId,
    /// The admin/owner address.
    Admin,
    /// The list of collaborator splits.
    Splits,
    /// Whether this contract has been initialized.
    Initialized,
    /// Consent map for split updates (address -> approved new_splits_hash).
    Consent(Address),
}

/// A record of a completed payment distribution.
#[contracttype]
#[derive(Clone, Debug)]
pub struct PaymentRecord {
    /// Track ID this payment was for.
    pub track_id: String,
    /// Total amount distributed (in stroops).
    pub total_amount: i128,
    /// Token contract address used.
    pub token: Address,
    /// Ledger sequence number when this occurred.
    pub ledger: u32,
}

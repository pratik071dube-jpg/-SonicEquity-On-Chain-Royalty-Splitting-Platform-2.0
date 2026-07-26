//! Data types for the track-registry contract.

use soroban_sdk::{contracttype, Address, String};

/// Storage key variants for the registry.
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    /// Whether registry is initialized.
    Initialized,
    /// The registry admin.
    Admin,
    /// Track info by string ID.
    Track(String),
    /// Sequential list of track IDs for pagination.
    TrackList,
    /// Total number of tracks registered.
    TrackCount,
}

/// Metadata about a registered track, stored in the registry.
#[contracttype]
#[derive(Clone, Debug)]
pub struct TrackInfo {
    /// Unique identifier for the track.
    pub track_id: String,
    /// The deployed royalty-split contract address for this track.
    pub split_contract: Address,
    /// The owner/admin address.
    pub admin: Address,
    /// Ledger sequence when the track was registered.
    pub registered_at: u32,
}

/// A single collaborator split entry (mirrors royalty-split contract).
#[contracttype]
#[derive(Clone, Debug)]
pub struct Split {
    /// Collaborator Stellar address.
    pub address: Address,
    /// Share in basis points (must sum to 10_000).
    pub share_bps: u32,
}

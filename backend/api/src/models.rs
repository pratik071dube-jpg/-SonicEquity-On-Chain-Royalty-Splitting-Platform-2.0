//! Database and API response models.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// A registered track and its split contract address.
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct Track {
    /// Unique track identifier (set by creator).
    pub track_id: String,
    /// Deployed royalty-split contract address.
    pub split_contract: String,
    /// Admin address.
    pub admin: String,
    /// When the track was registered (ledger timestamp).
    pub registered_at: DateTime<Utc>,
    /// Stellar ledger sequence at registration.
    pub ledger_sequence: i64,
}

/// A single payment distribution event.
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct PaymentEvent {
    /// Auto-incrementing row ID.
    pub id: i64,
    /// Track this payment was for.
    pub track_id: String,
    /// Payer Stellar address.
    pub payer: String,
    /// Token contract address.
    pub token_address: String,
    /// Total amount in stroops.
    pub total_amount: i64,
    /// When the payment was processed.
    pub paid_at: DateTime<Utc>,
    /// Transaction hash on Stellar.
    pub tx_hash: String,
    /// Ledger sequence.
    pub ledger_sequence: i64,
}

/// A single collaborator's share distribution for one payment.
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct CollaboratorPayment {
    pub id: i64,
    pub payment_id: i64,
    pub track_id: String,
    pub address: String,
    pub amount: i64,
    pub share_bps: i32,
}

/// A collaborator's aggregated earnings across all tracks.
#[derive(Debug, Serialize, Deserialize)]
pub struct CollaboratorEarnings {
    pub address: String,
    pub total_earnings: i64,
    pub payment_count: i64,
    pub tracks: Vec<TrackEarnings>,
}

/// Earnings for one specific track.
#[derive(Debug, Serialize, Deserialize)]
pub struct TrackEarnings {
    pub track_id: String,
    pub total: i64,
    pub payment_count: i64,
}

/// Request body for creating a track.
#[derive(Debug, Deserialize)]
pub struct CreateTrackRequest {
    pub track_id: String,
    pub split_contract: String,
    pub admin: String,
    pub ledger_sequence: i64,
}

/// Paginated list response.
#[derive(Debug, Serialize)]
pub struct PaginatedResponse<T> {
    pub items: Vec<T>,
    pub total: i64,
    pub offset: i64,
    pub limit: i64,
}

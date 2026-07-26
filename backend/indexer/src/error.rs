//! Indexer-specific error types.

use thiserror::Error;

/// Errors produced by the event indexer.
#[derive(Debug, Error)]
pub enum IndexerError {
    /// HTTP request to Soroban RPC failed.
    #[error("RPC request failed: {0}")]
    RpcRequest(#[from] reqwest::Error),

    /// RPC returned a well-formed error response.
    #[error("RPC error {code}: {message}")]
    RpcError { code: i64, message: String },

    /// JSON deserialization of RPC response failed.
    #[error("JSON parse error: {0}")]
    JsonParse(#[from] serde_json::Error),

    /// Database write failed.
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    /// An event's payload could not be decoded.
    #[error("Event decode error: {0}")]
    EventDecode(String),

    /// Environment configuration is missing.
    #[error("Missing config: {0}")]
    MissingConfig(String),
}

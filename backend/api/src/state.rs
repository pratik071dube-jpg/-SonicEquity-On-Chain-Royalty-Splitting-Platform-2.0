//! Shared application state passed to all route handlers.

use sqlx::SqlitePool;
use std::sync::Arc;
use tokio::sync::broadcast;

/// An SSE event pushed to frontend subscribers.
#[derive(Clone, Debug, serde::Serialize)]
pub struct SseEvent {
    /// Event type (e.g., "payment", "track_registered")
    pub event_type: String,
    /// Serialized JSON payload
    pub payload: serde_json::Value,
}

/// Shared application state (wrapped in Arc for cheap cloning).
#[derive(Clone)]
pub struct AppState {
    /// SQLite connection pool.
    pub db: SqlitePool,
    /// Broadcast channel for real-time SSE events.
    /// The indexer publishes events; route handlers subscribe.
    pub event_tx: Arc<broadcast::Sender<SseEvent>>,
}

impl AppState {
    /// Create a new `AppState` from a database pool.
    pub fn new(db: SqlitePool) -> Self {
        let (tx, _) = broadcast::channel(256);
        Self {
            db,
            event_tx: Arc::new(tx),
        }
    }
}

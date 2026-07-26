//! Route registration — assembles all sub-routers into the main app router.

pub mod collaborators;
pub mod events;
pub mod tracks;

use axum::{
    routing::{get, post},
    Router,
};
use crate::state::AppState;

/// Build the complete application router.
pub fn app_router(state: AppState) -> Router {
    Router::new()
        // Track routes
        .route("/tracks", get(tracks::list_tracks).post(tracks::create_track))
        .route("/tracks/:id", get(tracks::get_track))
        .route("/tracks/:id/payments", get(tracks::get_track_payments))
        // Real-time SSE stream for a track
        .route("/tracks/:id/events", get(events::track_events_sse))
        // Collaborator earnings
        .route("/collaborator/:address/earnings", get(collaborators::get_earnings))
        // Health check
        .route("/health", get(health_check))
        .with_state(state)
}

/// Simple health-check endpoint.
async fn health_check() -> axum::Json<serde_json::Value> {
    axum::Json(serde_json::json!({ "status": "ok", "service": "royalty-api" }))
}

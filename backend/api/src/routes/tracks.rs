//! Track-related REST endpoints.

use axum::{
    extract::{Path, Query, State},
    Json,
};
use serde::Deserialize;
use tracing::instrument;

use crate::{
    error::ApiError,
    models::{CreateTrackRequest, PaginatedResponse, PaymentEvent, Track},
    state::AppState,
};

/// Query parameters for list endpoints.
#[derive(Deserialize, Debug)]
pub struct PaginationParams {
    #[serde(default)]
    pub offset: i64,
    #[serde(default = "default_limit")]
    pub limit: i64,
}

fn default_limit() -> i64 {
    20
}

/// `GET /tracks` — List all registered tracks with pagination.
#[instrument(skip(state))]
pub async fn list_tracks(
    State(state): State<AppState>,
    Query(params): Query<PaginationParams>,
) -> Result<Json<PaginatedResponse<Track>>, ApiError> {
    let limit = params.limit.clamp(1, 100);
    let offset = params.offset.max(0);

    let items = sqlx::query_as::<_, Track>(
        "SELECT track_id, split_contract, admin, registered_at, ledger_sequence \
         FROM tracks ORDER BY registered_at DESC LIMIT ?1 OFFSET ?2",
    )
    .bind(limit)
    .bind(offset)
    .fetch_all(&state.db)
    .await?;

    let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM tracks")
        .fetch_one(&state.db)
        .await?;

    Ok(Json(PaginatedResponse { items, total, offset, limit }))
}

/// `GET /tracks/:id` — Get a specific track by ID.
#[instrument(skip(state))]
pub async fn get_track(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<Track>, ApiError> {
    let track = sqlx::query_as::<_, Track>(
        "SELECT track_id, split_contract, admin, registered_at, ledger_sequence \
         FROM tracks WHERE track_id = ?1",
    )
    .bind(&id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| ApiError::NotFound(format!("Track '{id}' not found")))?;

    Ok(Json(track))
}

/// `POST /tracks` — Manually register a track (used by indexer or CLI).
#[instrument(skip(state))]
pub async fn create_track(
    State(state): State<AppState>,
    Json(req): Json<CreateTrackRequest>,
) -> Result<Json<Track>, ApiError> {
    if req.track_id.is_empty() {
        return Err(ApiError::Validation("track_id cannot be empty".to_string()));
    }
    if req.split_contract.is_empty() {
        return Err(ApiError::Validation(
            "split_contract cannot be empty".to_string(),
        ));
    }

    sqlx::query(
        "INSERT INTO tracks (track_id, split_contract, admin, ledger_sequence) \
         VALUES (?1, ?2, ?3, ?4) ON CONFLICT(track_id) DO NOTHING",
    )
    .bind(&req.track_id)
    .bind(&req.split_contract)
    .bind(&req.admin)
    .bind(req.ledger_sequence)
    .execute(&state.db)
    .await?;

    let track = sqlx::query_as::<_, Track>(
        "SELECT track_id, split_contract, admin, registered_at, ledger_sequence \
         FROM tracks WHERE track_id = ?1",
    )
    .bind(&req.track_id)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(track))
}

/// `GET /tracks/:id/payments` — Paginated payment history for a track.
#[instrument(skip(state))]
pub async fn get_track_payments(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Query(params): Query<PaginationParams>,
) -> Result<Json<PaginatedResponse<PaymentEvent>>, ApiError> {
    // Verify track exists
    let exists: bool =
        sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM tracks WHERE track_id = ?1)")
            .bind(&id)
            .fetch_one(&state.db)
            .await?;

    if !exists {
        return Err(ApiError::NotFound(format!("Track '{id}' not found")));
    }

    let limit = params.limit.clamp(1, 100);
    let offset = params.offset.max(0);

    let items = sqlx::query_as::<_, PaymentEvent>(
        "SELECT id, track_id, payer, token_address, total_amount, paid_at, tx_hash, ledger_sequence \
         FROM payment_events WHERE track_id = ?1 \
         ORDER BY ledger_sequence DESC LIMIT ?2 OFFSET ?3",
    )
    .bind(&id)
    .bind(limit)
    .bind(offset)
    .fetch_all(&state.db)
    .await?;

    let total: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM payment_events WHERE track_id = ?1")
            .bind(&id)
            .fetch_one(&state.db)
            .await?;

    Ok(Json(PaginatedResponse { items, total, offset, limit }))
}

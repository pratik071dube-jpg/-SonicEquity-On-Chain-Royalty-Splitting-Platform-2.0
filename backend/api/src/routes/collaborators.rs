//! Collaborator earnings endpoints.

use axum::{
    extract::{Path, State},
    Json,
};
use tracing::instrument;

use crate::{
    error::ApiError,
    models::{CollaboratorEarnings, TrackEarnings},
    state::AppState,
};

/// `GET /collaborator/:address/earnings` — Get total earnings for a collaborator.
///
/// Returns aggregate earnings across all tracks, broken down per track.
#[instrument(skip(state))]
pub async fn get_earnings(
    State(state): State<AppState>,
    Path(address): Path<String>,
) -> Result<Json<CollaboratorEarnings>, ApiError> {
    // Validate address format (basic check: starts with G, length 56)
    if !address.starts_with('G') || address.len() != 56 {
        return Err(ApiError::Validation(
            "Invalid Stellar address format. Must be a valid G-address (56 characters).".to_string(),
        ));
    }

    let total_earnings: i64 = sqlx::query_scalar(
        "SELECT COALESCE(SUM(amount), 0) FROM collaborator_payments WHERE address = ?1",
    )
    .bind(&address)
    .fetch_one(&state.db)
    .await?;

    let payment_count: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM collaborator_payments WHERE address = ?1")
            .bind(&address)
            .fetch_one(&state.db)
            .await?;

    // Per-track breakdown
    let track_rows: Vec<(String, i64, i64)> = sqlx::query_as(
        "SELECT track_id, SUM(amount), COUNT(*) \
         FROM collaborator_payments WHERE address = ?1 \
         GROUP BY track_id ORDER BY SUM(amount) DESC",
    )
    .bind(&address)
    .fetch_all(&state.db)
    .await?;

    let tracks = track_rows
        .into_iter()
        .map(|(track_id, total, count)| TrackEarnings {
            track_id,
            total,
            payment_count: count,
        })
        .collect();

    Ok(Json(CollaboratorEarnings {
        address,
        total_earnings,
        payment_count,
        tracks,
    }))
}

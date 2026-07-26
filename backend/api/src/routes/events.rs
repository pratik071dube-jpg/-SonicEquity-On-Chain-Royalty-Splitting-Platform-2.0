//! Server-Sent Events (SSE) endpoint for real-time payment updates.

use axum::{
    extract::{Path, State},
    response::{
        sse::{Event, KeepAlive, Sse},
        IntoResponse,
    },
};
use std::{convert::Infallible, time::Duration};
use tokio_stream::{wrappers::BroadcastStream, StreamExt};
use tracing::instrument;

use crate::state::AppState;

/// `GET /tracks/:id/events` — SSE stream for real-time payment events on a track.
///
/// Clients connect and receive a stream of JSON events whenever a payment
/// is indexed for the requested track. Heartbeat keepalives are sent every 15s.
#[instrument(skip(state))]
pub async fn track_events_sse(
    State(state): State<AppState>,
    Path(track_id): Path<String>,
) -> impl IntoResponse {
    let rx = state.event_tx.subscribe();
    let stream = BroadcastStream::new(rx)
        .filter_map(move |result| {
            let track_id = track_id.clone();
            match result {
                Ok(event) if event.event_type == "payment" => {
                    // Only forward events for this specific track
                    let is_match = event
                        .payload
                        .get("track_id")
                        .and_then(|v| v.as_str())
                        .map(|id| id == track_id)
                        .unwrap_or(false);

                    if is_match {
                        let data = serde_json::to_string(&event.payload).ok()?;
                        Some(Ok::<Event, Infallible>(Event::default().data(data)))
                    } else {
                        None
                    }
                }
                Ok(event) if event.event_type == "track_registered" => {
                    let data = serde_json::to_string(&event.payload).unwrap_or_default();
                    Some(Ok(Event::default().event("track_registered").data(data)))
                }
                _ => None,
            }
        });

    Sse::new(stream).keep_alive(
        KeepAlive::new()
            .interval(Duration::from_secs(15))
            .text("heartbeat"),
    )
}

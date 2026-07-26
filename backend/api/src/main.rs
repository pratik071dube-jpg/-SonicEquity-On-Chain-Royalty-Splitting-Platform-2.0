//! Royalty API Server — Axum REST + SSE backend for the royalty-split platform.
//!
//! Endpoints:
//! - `GET  /health`
//! - `GET  /tracks`
//! - `POST /tracks`
//! - `GET  /tracks/:id`
//! - `GET  /tracks/:id/payments`
//! - `GET  /tracks/:id/events` (SSE)
//! - `GET  /collaborator/:address/earnings`

mod db;
mod error;
mod models;
mod routes;
mod state;

use anyhow::Context;
use std::net::SocketAddr;
use tower_http::{
    cors::{Any, CorsLayer},
    limit::RequestBodyLimitLayer,
    trace::TraceLayer,
};
use tracing::info;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Load environment variables from .env
    let _ = dotenvy::dotenv();

    // Initialize structured logging
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_env("LOG_LEVEL")
                .or_else(|_| "royalty_api=info,tower_http=info".parse()),
        )
        .json()
        .init();

    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "sqlite:./royalty.db".to_string());

    let listen_addr = std::env::var("LISTEN_ADDR")
        .unwrap_or_else(|_| "0.0.0.0:3001".to_string());

    // Initialize database
    let db_pool = db::init_pool(&database_url)
        .await
        .context("Failed to initialize database")?;

    let state = state::AppState::new(db_pool);

    // Build router with middleware
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = routes::app_router(state)
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .layer(RequestBodyLimitLayer::new(1_024 * 1_024)); // 1 MB body limit

    let addr: SocketAddr = listen_addr
        .parse()
        .context("Invalid LISTEN_ADDR")?;

    info!("Starting royalty-api on {addr}");

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .context("Failed to bind TCP listener")?;

    axum::serve(listener, app)
        .await
        .context("Server failed")?;

    Ok(())
}

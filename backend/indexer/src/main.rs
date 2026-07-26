//! Royalty Event Indexer — polls Soroban RPC for contract events and writes
//! them to SQLite, broadcasting to SSE subscribers via the API's event channel.
//!
//! The indexer and API share the same SQLite database. The indexer writes
//! payment events; the API reads and streams them.
//!
//! # Event Flow
//! Soroban RPC (getEvents) -> Parser -> SQLite write + broadcast channel

mod error;
mod parser;
mod rpc;

use anyhow::Context;
use rpc::SorobanRpcClient;
use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
use std::time::Duration;
use tracing::{error, info, warn};

/// Configuration loaded from environment variables.
struct Config {
    /// Soroban RPC endpoint.
    rpc_url: String,
    /// Comma-separated list of contract IDs to watch.
    contract_ids: Vec<String>,
    /// How often to poll for new events.
    poll_interval_secs: u64,
    /// SQLite database URL (shared with API).
    database_url: String,
    /// Starting ledger (0 = use latest - 1000).
    start_ledger: u32,
}

impl Config {
    fn from_env() -> Result<Self, error::IndexerError> {
        let rpc_url = std::env::var("SOROBAN_RPC_URL")
            .unwrap_or_else(|_| "https://soroban-testnet.stellar.org".to_string());

        let contract_ids_str = std::env::var("WATCH_CONTRACT_IDS")
            .unwrap_or_default();

        let contract_ids: Vec<String> = contract_ids_str
            .split(',')
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .map(String::from)
            .collect();

        let poll_interval_secs = std::env::var("POLL_INTERVAL_SECS")
            .ok()
            .and_then(|s| s.parse().ok())
            .unwrap_or(5);

        let database_url = std::env::var("DATABASE_URL")
            .unwrap_or_else(|_| "sqlite:./royalty.db".to_string());

        let start_ledger = std::env::var("START_LEDGER")
            .ok()
            .and_then(|s| s.parse().ok())
            .unwrap_or(0);

        Ok(Self {
            rpc_url,
            contract_ids,
            poll_interval_secs,
            database_url,
            start_ledger,
        })
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let _ = dotenvy::dotenv();

    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_env("LOG_LEVEL")
                .or_else(|_| "royalty_indexer=info".parse()),
        )
        .json()
        .init();

    let config = Config::from_env().context("Failed to load indexer config")?;

    if config.contract_ids.is_empty() {
        warn!("No WATCH_CONTRACT_IDS configured — indexer will not process any events.");
        warn!("Set WATCH_CONTRACT_IDS=<contract_id1>,<contract_id2> in .env");
    }

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&config.database_url)
        .await
        .context("Failed to connect to database")?;

    let rpc_client = SorobanRpcClient::new(config.rpc_url.clone());

    info!("Starting indexer. RPC: {}", config.rpc_url);
    info!("Watching contracts: {:?}", config.contract_ids);
    info!("Poll interval: {}s", config.poll_interval_secs);

    // Determine starting ledger
    let mut current_ledger = if config.start_ledger > 0 {
        config.start_ledger
    } else {
        match rpc_client.get_latest_ledger().await {
            Ok(latest) => latest.saturating_sub(1000),
            Err(e) => {
                warn!("Could not get latest ledger: {e}. Starting from ledger 1.");
                 1
            }
        }
    };

    info!("Starting from ledger {current_ledger}");

    loop {
        if config.contract_ids.is_empty() {
            tokio::time::sleep(Duration::from_secs(config.poll_interval_secs)).await;
            continue;
        }

        match rpc_client
            .get_events(current_ledger, &config.contract_ids, 100)
            .await
        {
            Ok(result) => {
                let event_count = result.events.len();
                if event_count > 0 {
                    info!("Processing {event_count} events from ledger {current_ledger}");
                }

                for event in &result.events {
                    match parser::parse_event(event) {
                        Ok(parsed) => {
                            if let Err(e) = handle_event(parsed, &pool).await {
                                error!("Failed to handle event {}: {e}", event.id);
                            }
                        }
                        Err(e) => {
                            warn!("Failed to parse event {}: {e}", event.id);
                        }
                    }
                }

                // Advance past the latest seen ledger
                if result.latest_ledger > current_ledger {
                    current_ledger = result.latest_ledger + 1;
                }
            }
            Err(e) => {
                error!("RPC error fetching events: {e}");
            }
        }

        tokio::time::sleep(Duration::from_secs(config.poll_interval_secs)).await;
    }
}

/// Process a parsed event and write it to the database.
async fn handle_event(
    event: parser::ParsedEvent,
    pool: &SqlitePool,
) -> Result<(), error::IndexerError> {
    match event {
        parser::ParsedEvent::PaymentDistributed(data) => {
            // Insert payment event (ignore conflicts — tx_hash is UNIQUE)
            sqlx::query(
                "INSERT OR IGNORE INTO payment_events \
                 (track_id, payer, token_address, total_amount, paid_at, tx_hash, ledger_sequence) \
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            )
            .bind(&data.track_id)
            .bind(&data.payer)
            .bind(&data.token_address)
            .bind(data.total_amount)
            .bind(&data.ledger_closed_at)
            .bind(&data.tx_hash)
            .bind(data.ledger_sequence as i64)
            .execute(pool)
            .await?;

            info!(
                "Indexed payment for track='{}' tx='{}'",
                data.track_id, data.tx_hash
            );
        }
        parser::ParsedEvent::TrackRegistered(data) => {
            sqlx::query(
                "INSERT OR IGNORE INTO tracks (track_id, split_contract, admin, ledger_sequence) \
                 VALUES (?1, ?2, ?3, ?4)",
            )
            .bind(&data.track_id)
            .bind(&data.split_contract)
            .bind(&data.admin)
            .bind(data.ledger_sequence as i64)
            .execute(pool)
            .await?;

            info!("Indexed track registration: '{}'", data.track_id);
        }
        parser::ParsedEvent::Unknown => {}
    }

    Ok(())
}

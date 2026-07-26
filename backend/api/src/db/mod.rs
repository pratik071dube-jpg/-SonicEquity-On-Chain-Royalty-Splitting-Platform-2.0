//! Database connection pool setup and schema migration.

use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
use tracing::info;

/// Initialize the SQLite database, run migrations, and return the pool.
///
/// # Errors
/// Returns an error if the database file cannot be opened or migrations fail.
pub async fn init_pool(database_url: &str) -> Result<SqlitePool, sqlx::Error> {
    info!("Connecting to database: {database_url}");

    let pool = SqlitePoolOptions::new()
        .max_connections(10)
        .connect(database_url)
        .await?;

    // Run embedded migrations
    run_migrations(&pool).await?;

    info!("Database initialized");
    Ok(pool)
}

/// Run schema creation SQL. Uses CREATE TABLE IF NOT EXISTS for idempotency.
async fn run_migrations(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS tracks (
            track_id        TEXT PRIMARY KEY,
            split_contract  TEXT NOT NULL,
            admin           TEXT NOT NULL,
            registered_at   TEXT NOT NULL DEFAULT (datetime('now')),
            ledger_sequence INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS payment_events (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            track_id        TEXT NOT NULL,
            payer           TEXT NOT NULL,
            token_address   TEXT NOT NULL,
            total_amount    INTEGER NOT NULL,
            paid_at         TEXT NOT NULL DEFAULT (datetime('now')),
            tx_hash         TEXT NOT NULL UNIQUE,
            ledger_sequence INTEGER NOT NULL,
            FOREIGN KEY (track_id) REFERENCES tracks(track_id)
        );

        CREATE TABLE IF NOT EXISTS collaborator_payments (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            payment_id      INTEGER NOT NULL,
            track_id        TEXT NOT NULL,
            address         TEXT NOT NULL,
            amount          INTEGER NOT NULL,
            share_bps       INTEGER NOT NULL,
            FOREIGN KEY (payment_id) REFERENCES payment_events(id)
        );

        CREATE INDEX IF NOT EXISTS idx_payments_track
            ON payment_events(track_id);
        CREATE INDEX IF NOT EXISTS idx_collab_payments_address
            ON collaborator_payments(address);
        CREATE INDEX IF NOT EXISTS idx_collab_payments_track
            ON collaborator_payments(track_id);
        "#,
    )
    .execute(pool)
    .await?;

    Ok(())
}

//! CLI-specific error types.

use thiserror::Error;

/// Errors that can occur during CLI operations.
#[derive(Debug, Error)]
pub enum CliError {
    /// An HTTP request to the Stellar Horizon or Soroban RPC failed.
    #[error("Network request failed: {0}")]
    NetworkError(#[from] reqwest::Error),

    /// A subprocess command (stellar-cli, cargo) failed.
    #[error("Command '{command}' failed with exit code {code}: {stderr}")]
    CommandFailed {
        command: String,
        code: i32,
        stderr: String,
    },

    /// An environment variable is missing.
    #[error("Missing environment variable: {0}")]
    MissingEnvVar(String),

    /// JSON deserialization failed.
    #[error("JSON parse error: {0}")]
    JsonError(#[from] serde_json::Error),

    /// I/O error (file read/write).
    #[error("I/O error: {0}")]
    IoError(#[from] std::io::Error),

    /// Contract deployment or verification failed.
    #[error("Contract error: {0}")]
    ContractError(String),

    /// Invalid argument provided to CLI.
    #[error("Invalid argument: {0}")]
    InvalidArgument(String),
}

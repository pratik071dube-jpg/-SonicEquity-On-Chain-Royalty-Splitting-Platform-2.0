//! Stellar Royalty CLI — build, deploy, verify, and invoke Soroban contracts.
//!
//! # Usage
//! ```
//! stellar-royalty-cli build
//! stellar-royalty-cli deploy --contract royalty-split --network testnet --source <keypair>
//! stellar-royalty-cli verify --address <contract_id> --network testnet
//! stellar-royalty-cli register-track --registry <addr> --track-id <id> --split-contract <addr>
//! ```

mod error;

use anyhow::Context;
use clap::{Parser, Subcommand};
use error::CliError;
use serde::{Deserialize, Serialize};
use std::{
    path::PathBuf,
    process::{Command, Stdio},
};
use tracing::{error, info, warn};

/// Top-level CLI arguments.
#[derive(Parser, Debug)]
#[command(
    name = "stellar-royalty-cli",
    version = "0.1.0",
    about = "Build, deploy, and manage Stellar royalty-split smart contracts",
    long_about = None
)]
struct Cli {
    /// Log verbosity level (error/warn/info/debug/trace)
    #[arg(long, global = true, default_value = "info", env = "LOG_LEVEL")]
    log_level: String,

    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand, Debug)]
enum Commands {
    /// Build all contract WASM binaries (runs cargo build --target wasm32-unknown-unknown).
    Build {
        /// Only build a specific contract (royalty-split or track-registry)
        #[arg(long)]
        contract: Option<String>,
    },

    /// Deploy a compiled contract WASM to Stellar Testnet.
    Deploy {
        /// Contract name to deploy (royalty-split or track-registry)
        #[arg(long)]
        contract: String,
        /// Stellar network to deploy to
        #[arg(long, default_value = "testnet")]
        network: String,
        /// Source account name or keypair file (used by stellar-cli)
        #[arg(long, env = "STELLAR_SOURCE_ACCOUNT")]
        source: String,
        /// Path to write deployed contract address
        #[arg(long, default_value = ".env.testnet")]
        output: PathBuf,
    },

    /// Verify a deployed contract responds correctly.
    Verify {
        /// Contract address (Stellar contract ID) to verify
        #[arg(long)]
        address: String,
        /// Network to query
        #[arg(long, default_value = "testnet")]
        network: String,
    },

    /// Register a track in the registry contract.
    RegisterTrack {
        /// Registry contract address
        #[arg(long, env = "REGISTRY_CONTRACT_ID")]
        registry: String,
        /// Track identifier string
        #[arg(long)]
        track_id: String,
        /// Pre-deployed split contract address
        #[arg(long)]
        split_contract: String,
        /// Source account
        #[arg(long, env = "STELLAR_SOURCE_ACCOUNT")]
        source: String,
        /// Network
        #[arg(long, default_value = "testnet")]
        network: String,
    },

    /// Fund a testnet account using Friendbot.
    Fund {
        /// Public key to fund
        #[arg(long)]
        address: String,
    },
}

/// Contract addresses written to the output env file.
#[derive(Debug, Serialize, Deserialize, Default)]
struct DeployedContracts {
    royalty_split_contract_id: Option<String>,
    track_registry_contract_id: Option<String>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Load .env if present
    let _ = dotenvy::dotenv();

    let cli = Cli::parse();

    // Initialize structured logging
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| cli.log_level.parse().unwrap_or_default()),
        )
        .init();

    match cli.command {
        Commands::Build { contract } => cmd_build(contract).await?,
        Commands::Deploy { contract, network, source, output } => {
            cmd_deploy(&contract, &network, &source, &output).await?
        }
        Commands::Verify { address, network } => cmd_verify(&address, &network).await?,
        Commands::RegisterTrack {
            registry,
            track_id,
            split_contract,
            source,
            network,
        } => cmd_register_track(&registry, &track_id, &split_contract, &source, &network).await?,
        Commands::Fund { address } => cmd_fund(&address).await?,
    }

    Ok(())
}

/// Build contract WASM binaries using cargo.
async fn cmd_build(contract: Option<String>) -> Result<(), CliError> {
    info!("Building contract WASM binaries...");

    let contracts_to_build: Vec<&str> = match contract.as_deref() {
        Some("royalty-split") => vec!["royalty-split"],
        Some("track-registry") => vec!["track-registry"],
        None => vec!["royalty-split", "track-registry"],
        Some(other) => {
            return Err(CliError::InvalidArgument(format!(
                "Unknown contract: '{other}'. Use 'royalty-split' or 'track-registry'"
            )))
        }
    };

    for contract_name in contracts_to_build {
        info!("Building {contract_name}...");
        run_command(
            "cargo",
            &[
                "build",
                "--package",
                contract_name,
                "--target",
                "wasm32-unknown-unknown",
                "--release",
            ],
        )?;
        info!("{contract_name} built successfully");
    }

    info!("All contracts built. WASM files in target/wasm32-unknown-unknown/release/");
    Ok(())
}

/// Deploy a contract using stellar-cli.
async fn cmd_deploy(
    contract: &str,
    network: &str,
    source: &str,
    output: &PathBuf,
) -> Result<(), CliError> {
    info!("Deploying {contract} to {network}...");

    let wasm_name = contract.replace('-', "_");
    let wasm_path = format!("target/wasm32-unknown-unknown/release/{wasm_name}.wasm");

    let output_str = run_command_capture(
        "stellar",
        &[
            "contract",
            "deploy",
            "--wasm",
            &wasm_path,
            "--source",
            source,
            "--network",
            network,
        ],
    )?;

    let contract_id = output_str.trim().to_string();
    info!("Deployed {contract} at address: {contract_id}");

    // Write to env file
    append_env_var(output, contract, &contract_id)?;

    Ok(())
}

/// Verify a deployed contract by calling get_track_id or track_count.
async fn cmd_verify(address: &str, network: &str) -> Result<(), CliError> {
    info!("Verifying contract at {address} on {network}...");

    // Try calling track_count (works for registry) then get_track_id (works for split)
    let result = run_command_capture(
        "stellar",
        &[
            "contract",
            "invoke",
            "--id",
            address,
            "--network",
            network,
            "--",
            "track_count",
        ],
    );

    match result {
        Ok(out) => {
            info!("Registry contract verified. Track count: {}", out.trim());
            Ok(())
        }
        Err(_) => {
            // Try split contract
            let out = run_command_capture(
                "stellar",
                &[
                    "contract",
                    "invoke",
                    "--id",
                    address,
                    "--network",
                    network,
                    "--",
                    "get_track_id",
                ],
            )?;
            info!("Split contract verified. Track ID: {}", out.trim());
            Ok(())
        }
    }
}

/// Register a track in the registry contract via stellar-cli invoke.
async fn cmd_register_track(
    registry: &str,
    track_id: &str,
    split_contract: &str,
    source: &str,
    network: &str,
) -> Result<(), CliError> {
    info!("Registering track '{track_id}' in registry {registry}...");

    run_command(
        "stellar",
        &[
            "contract",
            "invoke",
            "--id",
            registry,
            "--source",
            source,
            "--network",
            network,
            "--",
            "register_track",
            "--admin",
            source,
            "--track_id",
            track_id,
            "--split_contract_address",
            split_contract,
        ],
    )?;

    info!("Track '{track_id}' registered successfully!");
    Ok(())
}

/// Fund a testnet account via Stellar Friendbot.
async fn cmd_fund(address: &str) -> Result<(), CliError> {
    info!("Funding {address} via Friendbot...");

    let client = reqwest::Client::new();
    let url = format!("https://friendbot.stellar.org?addr={address}");

    let resp = client.get(&url).send().await?;
    if resp.status().is_success() {
        info!("Account {address} funded successfully on testnet!");
    } else {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        warn!("Friendbot returned {status}: {body}");
    }

    Ok(())
}

// --- Utility functions ---

/// Run a command, streaming stdout/stderr, and return an error on non-zero exit.
fn run_command(program: &str, args: &[&str]) -> Result<(), CliError> {
    let status = Command::new(program)
        .args(args)
        .status()
        .map_err(|e| CliError::IoError(e))?;

    if !status.success() {
        return Err(CliError::CommandFailed {
            command: format!("{program} {}", args.join(" ")),
            code: status.code().unwrap_or(-1),
            stderr: String::new(),
        });
    }
    Ok(())
}

/// Run a command and capture its stdout output.
fn run_command_capture(program: &str, args: &[&str]) -> Result<String, CliError> {
    let output = Command::new(program)
        .args(args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .map_err(|e| CliError::IoError(e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).into_owned();
        return Err(CliError::CommandFailed {
            command: format!("{program} {}", args.join(" ")),
            code: output.status.code().unwrap_or(-1),
            stderr,
        });
    }

    Ok(String::from_utf8_lossy(&output.stdout).into_owned())
}

/// Append or update an environment variable in the given file.
fn append_env_var(path: &PathBuf, contract: &str, value: &str) -> Result<(), CliError> {
    let key = match contract {
        "royalty-split" => "NEXT_PUBLIC_ROYALTY_SPLIT_WASM_HASH",
        "track-registry" => "NEXT_PUBLIC_REGISTRY_CONTRACT_ID",
        other => return Err(CliError::InvalidArgument(format!("Unknown contract: {other}"))),
    };

    // Read existing content or start fresh
    let existing = std::fs::read_to_string(path).unwrap_or_default();
    let mut lines: Vec<String> = existing
        .lines()
        .filter(|l| !l.starts_with(&format!("{key}=")))
        .map(String::from)
        .collect();

    lines.push(format!("{key}={value}"));

    std::fs::write(path, lines.join("\n") + "\n")?;
    info!("Written {key}={value} to {}", path.display());
    Ok(())
}

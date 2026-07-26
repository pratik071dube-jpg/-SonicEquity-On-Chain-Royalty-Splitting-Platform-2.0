//! Soroban RPC client for polling contract events.

use serde::{Deserialize, Serialize};
use tracing::{debug, warn};

use crate::error::IndexerError;

/// Soroban RPC JSON-RPC request structure.
#[derive(Serialize)]
struct RpcRequest<'a, T: Serialize> {
    jsonrpc: &'a str,
    id: u64,
    method: &'a str,
    params: T,
}

/// Top-level RPC response wrapper.
#[derive(Deserialize, Debug)]
pub struct RpcResponse<T> {
    pub result: Option<T>,
    pub error: Option<RpcError>,
}

/// RPC error object.
#[derive(Deserialize, Debug)]
pub struct RpcError {
    pub code: i64,
    pub message: String,
}

/// Parameters for `getEvents` RPC call.
#[derive(Serialize)]
struct GetEventsParams {
    #[serde(rename = "startLedger")]
    start_ledger: u32,
    filters: Vec<EventFilter>,
    pagination: EventPagination,
}

/// Filter specification for event queries.
#[derive(Serialize)]
struct EventFilter {
    #[serde(rename = "type")]
    event_type: String,
    #[serde(rename = "contractIds")]
    contract_ids: Vec<String>,
}

/// Pagination for event queries.
#[derive(Serialize)]
struct EventPagination {
    limit: u32,
}

/// Result of a `getEvents` call.
#[derive(Deserialize, Debug)]
pub struct GetEventsResult {
    pub events: Vec<SorobanEvent>,
    #[serde(rename = "latestLedger")]
    pub latest_ledger: u32,
}

/// A single Soroban contract event from the RPC.
#[derive(Deserialize, Debug, Clone)]
pub struct SorobanEvent {
    #[serde(rename = "type")]
    pub event_type: String,
    pub ledger: u32,
    #[serde(rename = "ledgerClosedAt")]
    pub ledger_closed_at: String,
    #[serde(rename = "contractId")]
    pub contract_id: String,
    pub id: String,
    #[serde(rename = "pagingToken")]
    pub paging_token: String,
    pub topic: Vec<String>,
    pub value: String,
    #[serde(rename = "txHash")]
    pub tx_hash: String,
}

/// Soroban RPC client.
pub struct SorobanRpcClient {
    http_client: reqwest::Client,
    rpc_url: String,
}

impl SorobanRpcClient {
    /// Create a new client pointing at `rpc_url`.
    pub fn new(rpc_url: String) -> Self {
        Self {
            http_client: reqwest::Client::new(),
            rpc_url,
        }
    }

    /// Fetch contract events starting from `start_ledger` for the given contract IDs.
    ///
    /// Returns up to `limit` events per call. Callers should loop with increasing
    /// `start_ledger` to process all events.
    pub async fn get_events(
        &self,
        start_ledger: u32,
        contract_ids: &[String],
        limit: u32,
    ) -> Result<GetEventsResult, IndexerError> {
        debug!(
            "Fetching events from ledger {start_ledger} for {} contracts",
            contract_ids.len()
        );

        let params = GetEventsParams {
            start_ledger,
            filters: vec![EventFilter {
                event_type: "contract".to_string(),
                contract_ids: contract_ids.to_vec(),
            }],
            pagination: EventPagination { limit },
        };

        let request = RpcRequest {
            jsonrpc: "2.0",
            id: 1,
            method: "getEvents",
            params,
        };

        let response: RpcResponse<GetEventsResult> = self
            .http_client
            .post(&self.rpc_url)
            .json(&request)
            .send()
            .await?
            .json()
            .await?;

        if let Some(err) = response.error {
            warn!("RPC error {}: {}", err.code, err.message);
            return Err(IndexerError::RpcError {
                code: err.code,
                message: err.message,
            });
        }

        response
            .result
            .ok_or_else(|| IndexerError::EventDecode("Empty RPC result".to_string()))
    }

    /// Get the latest ledger sequence from the network.
    pub async fn get_latest_ledger(&self) -> Result<u32, IndexerError> {
        #[derive(Serialize)]
        struct EmptyParams;

        #[derive(Deserialize)]
        struct LatestLedgerResult {
            sequence: u32,
        }

        let request = RpcRequest {
            jsonrpc: "2.0",
            id: 2,
            method: "getLatestLedger",
            params: EmptyParams,
        };

        let response: RpcResponse<LatestLedgerResult> = self
            .http_client
            .post(&self.rpc_url)
            .json(&request)
            .send()
            .await?
            .json()
            .await?;

        if let Some(err) = response.error {
            return Err(IndexerError::RpcError {
                code: err.code,
                message: err.message,
            });
        }

        Ok(response
            .result
            .ok_or_else(|| IndexerError::EventDecode("No result for getLatestLedger".to_string()))?
            .sequence)
    }
}

//! Parse raw Soroban event data into domain types.
//!
//! Soroban events contain XDR-encoded topics and values. For our indexer,
//! we decode the topic symbol to identify the event type and extract the
//! payload from the serialized JSON value field where possible.

use tracing::{debug, warn};

use crate::{error::IndexerError, rpc::SorobanEvent};

/// Parsed, domain-specific event type.
#[derive(Debug, Clone)]
pub enum ParsedEvent {
    /// A payment was distributed by a royalty-split contract.
    PaymentDistributed(PaymentData),
    /// A track was registered in the registry contract.
    TrackRegistered(TrackData),
    /// An event type we don't handle.
    Unknown,
}

/// Payment distribution event data.
#[derive(Debug, Clone)]
pub struct PaymentData {
    pub track_id: String,
    pub payer: String,
    pub token_address: String,
    pub total_amount: i64,
    pub tx_hash: String,
    pub ledger_sequence: u32,
    pub ledger_closed_at: String,
}

/// Track registration event data.
#[derive(Debug, Clone)]
pub struct TrackData {
    pub track_id: String,
    pub split_contract: String,
    pub admin: String,
    pub ledger_sequence: u32,
}

/// Parse a raw Soroban event into a domain event.
///
/// Returns `ParsedEvent::Unknown` for unrecognized event types rather than
/// erroring, so the indexer can safely skip unknown events.
pub fn parse_event(event: &SorobanEvent) -> Result<ParsedEvent, IndexerError> {
    debug!("Parsing event id={} type={}", event.id, event.event_type);

    // Topic[0] is the event name (a Symbol), topic[1] is typically track_id
    // Both are XDR-encoded. For simplicity, we match on topic count + known prefixes
    // In a production indexer, decode XDR using stellar-xdr crate
    let topic_count = event.topic.len();

    if topic_count < 2 {
        return Ok(ParsedEvent::Unknown);
    }

    // The topic[0] is an XDR Symbol. We detect event type by presence of known strings
    // This is a pragmatic approach — a full XDR decoder would be used in production
    let topic_str = &event.topic[0];

    if topic_str.contains("pay") {
        // PaymentDistributed event from royalty-split contract
        // Value contains (payer, token_address, amount, ledger) as XDR tuple
        // For now, extract from event metadata where available
        Ok(ParsedEvent::PaymentDistributed(PaymentData {
            track_id: extract_string_from_topic(&event.topic, 1),
            payer: String::new(), // Populated by on-chain indexer from XDR
            token_address: String::new(),
            total_amount: 0, // Would be decoded from XDR value
            tx_hash: event.tx_hash.clone(),
            ledger_sequence: event.ledger,
            ledger_closed_at: event.ledger_closed_at.clone(),
        }))
    } else if topic_str.contains("register") {
        Ok(ParsedEvent::TrackRegistered(TrackData {
            track_id: extract_string_from_topic(&event.topic, 1),
            split_contract: String::new(),
            admin: String::new(),
            ledger_sequence: event.ledger,
        }))
    } else {
        debug!("Skipping unknown event type: {topic_str}");
        Ok(ParsedEvent::Unknown)
    }
}

/// Extract a readable string from a topic entry.
/// Topics are XDR-encoded; this is a best-effort ASCII extraction.
fn extract_string_from_topic(topics: &[String], index: usize) -> String {
    topics
        .get(index)
        .cloned()
        .unwrap_or_default()
}

//! Error types for the track-registry contract.

use soroban_sdk::contracterror;

/// All error conditions the track-registry contract can produce.
#[contracterror]
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
#[repr(u32)]
pub enum Error {
    /// A track with this ID is already registered.
    TrackAlreadyExists = 1,
    /// No track with the given ID exists in the registry.
    TrackNotFound = 2,
    /// Caller is not authorized for this operation.
    Unauthorized = 3,
    /// The split configuration is invalid (delegated from split contract).
    InvalidSplits = 4,
    /// Registry has not been initialized.
    NotInitialized = 5,
    /// Registry has already been initialized.
    AlreadyInitialized = 6,
    /// Pagination offset exceeds available tracks.
    OutOfRange = 7,
}

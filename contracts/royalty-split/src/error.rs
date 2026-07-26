//! Contract error types with numeric codes for client-side handling.

use soroban_sdk::contracterror;

/// All error conditions the royalty-split contract can produce.
/// Each variant maps to a u32 code returned in the contract response.
#[contracterror]
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
#[repr(u32)]
pub enum Error {
    /// Contract has already been initialized. Re-initialization is forbidden.
    AlreadyInitialized = 1,
    /// Contract has not been initialized yet.
    NotInitialized = 2,
    /// Splits do not sum to exactly 10_000 basis points.
    InvalidSplitTotal = 3,
    /// No splits were provided (empty collaborator list).
    EmptySplits = 4,
    /// A split has zero basis points, which is meaningless.
    ZeroShareSplit = 5,
    /// Caller is not authorized for this operation.
    Unauthorized = 6,
    /// Payment amount is zero or negative.
    InvalidAmount = 7,
    /// Too many collaborators (exceeds contract limit).
    TooManyCollaborators = 8,
    /// A required approval is missing for the split update.
    MissingConsent = 9,
    /// Token transfer failed internally.
    TransferFailed = 10,
}

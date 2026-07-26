//! Royalty Split Contract — distributes incoming token payments among
//! collaborators according to pre-configured basis-point shares.
//!
//! # Design Decisions
//! - Uses **basis points** (1/10_000) exclusively — no floating point.
//! - Rounding remainder (from integer division) always goes to the **first**
//!   collaborator (the admin), ensuring deterministic, dust-free splits.
//! - Supports **multi-signature split updates**: all current collaborators must
//!   call `approve_split_update` with the same `new_splits` before `update_splits`
//!   finalizes the change.
//! - Max 20 collaborators per track to bound gas costs.

#![no_std]

mod error;
mod types;

#[cfg(test)]
mod test;

use error::Error;
use soroban_sdk::{
    contract, contractimpl, symbol_short, token, vec, Address, Env, String, Vec,
};
use types::{DataKey, Split};

/// Maximum number of collaborators allowed per track.
const MAX_COLLABORATORS: usize = 20;
/// Required total in basis points (100%).
const TOTAL_BPS: u32 = 10_000;

#[contract]
pub struct RoyaltySplitContract;

#[contractimpl]
impl RoyaltySplitContract {
    /// Initialize the contract with track metadata and collaborator splits.
    ///
    /// # Errors
    /// - [`Error::AlreadyInitialized`] if called more than once.
    /// - [`Error::EmptySplits`] if `splits` is empty.
    /// - [`Error::TooManyCollaborators`] if `splits.len() > 20`.
    /// - [`Error::ZeroShareSplit`] if any split has `share_bps == 0`.
    /// - [`Error::InvalidSplitTotal`] if shares don't sum to 10_000.
    pub fn initialize(
        env: Env,
        track_id: String,
        admin: Address,
        splits: Vec<Split>,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Initialized) {
            return Err(Error::AlreadyInitialized);
        }

        admin.require_auth();

        Self::validate_splits(&splits)?;

        env.storage().instance().set(&DataKey::TrackId, &track_id);
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Splits, &splits);
        env.storage().instance().set(&DataKey::Initialized, &true);

        // Emit initialization event
        env.events().publish(
            (symbol_short!("init"), track_id.clone()),
            splits.clone(),
        );

        Ok(())
    }

    /// Accept an incoming token payment and distribute it atomically
    /// to all collaborators according to their basis-point shares.
    ///
    /// The caller must have approved a transfer of `amount` tokens from
    /// their address to this contract before calling this function.
    ///
    /// Rounding remainder always accrues to the first collaborator.
    ///
    /// # Errors
    /// - [`Error::NotInitialized`] if contract is not set up.
    /// - [`Error::InvalidAmount`] if `amount <= 0`.
    pub fn distribute(
        env: Env,
        payer: Address,
        token_address: Address,
        amount: i128,
    ) -> Result<(), Error> {
        Self::require_initialized(&env)?;

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        payer.require_auth();

        let splits: Vec<Split> = env
            .storage()
            .instance()
            .get(&DataKey::Splits)
            .ok_or(Error::NotInitialized)?;

        let track_id: String = env
            .storage()
            .instance()
            .get(&DataKey::TrackId)
            .ok_or(Error::NotInitialized)?;

        let token_client = token::Client::new(&env, &token_address);

        // Pull funds from payer into contract first
        token_client.transfer(&payer, &env.current_contract_address(), &amount);

        let mut distributed: i128 = 0;
        let split_count = splits.len();

        // Distribute to all collaborators except the first (handles remainder)
        for i in 1..split_count {
            let split = splits.get(i).ok_or(Error::NotInitialized)?;
            let share = (amount * i128::from(split.share_bps)) / i128::from(TOTAL_BPS);
            if share > 0 {
                token_client.transfer(
                    &env.current_contract_address(),
                    &split.address,
                    &share,
                );
                distributed += share;
            }
        }

        // First collaborator receives remainder (avoids dust loss)
        let first_split = splits.get(0).ok_or(Error::NotInitialized)?;
        let remainder = amount - distributed;
        if remainder > 0 {
            token_client.transfer(
                &env.current_contract_address(),
                &first_split.address,
                &remainder,
            );
        }

        // Emit payment distribution event
        env.events().publish(
            (symbol_short!("pay"), track_id.clone()),
            (payer, token_address, amount, env.ledger().sequence()),
        );

        Ok(())
    }

    /// Record a collaborator's approval for a proposed new split configuration.
    ///
    /// All current collaborators must approve before `update_splits` succeeds.
    /// The `new_splits_hash` should be the SHA-256 of the serialized new splits
    /// (computed client-side and verified by comparing all approvals).
    ///
    /// # Errors
    /// - [`Error::NotInitialized`] if contract is not set up.
    /// - [`Error::Unauthorized`] if caller is not a current collaborator.
    pub fn approve_split_update(
        env: Env,
        approver: Address,
        new_splits_hash: soroban_sdk::Bytes,
    ) -> Result<(), Error> {
        Self::require_initialized(&env)?;
        approver.require_auth();

        let splits: Vec<Split> = env
            .storage()
            .instance()
            .get(&DataKey::Splits)
            .ok_or(Error::NotInitialized)?;

        // Only current collaborators may approve
        let is_collaborator = splits.iter().any(|s| s.address == approver);
        if !is_collaborator {
            return Err(Error::Unauthorized);
        }

        env.storage()
            .instance()
            .set(&DataKey::Consent(approver.clone()), &new_splits_hash);

        env.events().publish(
            (symbol_short!("approve"), approver),
            new_splits_hash,
        );

        Ok(())
    }

    /// Finalize a split update once all current collaborators have approved.
    ///
    /// Validates that every collaborator has recorded the same `new_splits_hash`.
    ///
    /// # Errors
    /// - [`Error::NotInitialized`] if contract is not set up.
    /// - [`Error::Unauthorized`] if caller is not the admin.
    /// - [`Error::MissingConsent`] if any collaborator hasn't approved.
    /// - [`Error::InvalidSplitTotal`] / etc. on new split validation.
    pub fn update_splits(
        env: Env,
        admin: Address,
        new_splits: Vec<Split>,
        new_splits_hash: soroban_sdk::Bytes,
    ) -> Result<(), Error> {
        Self::require_initialized(&env)?;
        admin.require_auth();

        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)?;
        if admin != stored_admin {
            return Err(Error::Unauthorized);
        }

        let current_splits: Vec<Split> = env
            .storage()
            .instance()
            .get(&DataKey::Splits)
            .ok_or(Error::NotInitialized)?;

        // Verify every current collaborator has consented to this exact hash
        for split in current_splits.iter() {
            let consent: Option<soroban_sdk::Bytes> = env
                .storage()
                .instance()
                .get(&DataKey::Consent(split.address.clone()));
            match consent {
                Some(h) if h == new_splits_hash => {}
                _ => return Err(Error::MissingConsent),
            }
        }

        Self::validate_splits(&new_splits)?;

        // Clear all consent records
        for split in current_splits.iter() {
            env.storage()
                .instance()
                .remove(&DataKey::Consent(split.address.clone()));
        }

        let track_id: String = env
            .storage()
            .instance()
            .get(&DataKey::TrackId)
            .ok_or(Error::NotInitialized)?;

        env.storage()
            .instance()
            .set(&DataKey::Splits, &new_splits);

        env.events().publish(
            (symbol_short!("update"), track_id),
            new_splits,
        );

        Ok(())
    }

    /// Return the current collaborator split configuration.
    ///
    /// # Errors
    /// - [`Error::NotInitialized`] if contract is not set up.
    pub fn get_splits(env: Env) -> Result<Vec<Split>, Error> {
        Self::require_initialized(&env)?;
        env.storage()
            .instance()
            .get(&DataKey::Splits)
            .ok_or(Error::NotInitialized)
    }

    /// Return the track identifier stored in this contract.
    ///
    /// # Errors
    /// - [`Error::NotInitialized`] if contract is not set up.
    pub fn get_track_id(env: Env) -> Result<String, Error> {
        Self::require_initialized(&env)?;
        env.storage()
            .instance()
            .get(&DataKey::TrackId)
            .ok_or(Error::NotInitialized)
    }

    /// Return the admin address for this contract.
    ///
    /// # Errors
    /// - [`Error::NotInitialized`] if contract is not set up.
    pub fn get_admin(env: Env) -> Result<Address, Error> {
        Self::require_initialized(&env)?;
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)
    }

    // --- Private helpers ---

    /// Validate that `splits` satisfies all contract invariants.
    fn validate_splits(splits: &Vec<Split>) -> Result<(), Error> {
        if splits.is_empty() {
            return Err(Error::EmptySplits);
        }
        if splits.len() > MAX_COLLABORATORS as u32 {
            return Err(Error::TooManyCollaborators);
        }
        let mut total: u32 = 0;
        for split in splits.iter() {
            if split.share_bps == 0 {
                return Err(Error::ZeroShareSplit);
            }
            total = total.saturating_add(split.share_bps);
        }
        if total != TOTAL_BPS {
            return Err(Error::InvalidSplitTotal);
        }
        Ok(())
    }

    /// Return an error if the contract has not been initialized.
    fn require_initialized(env: &Env) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Initialized) {
            Ok(())
        } else {
            Err(Error::NotInitialized)
        }
    }
}

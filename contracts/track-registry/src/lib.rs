//! Track Registry Contract — maintains a mapping of track IDs to their
//! deployed RoyaltySplitContract addresses, and provides a factory-style
//! registration interface.
//!
//! # Cross-Contract Calls
//! After recording the split contract address, `pay_track` cross-calls the
//! split contract's `distribute` method, demonstrating Soroban inter-contract
//! communication.
//!
//! # Note on Factory Pattern
//! True on-chain contract deployment (deploying WASM from within a contract)
//! requires the WASM hash of the target contract to be pre-uploaded to the
//! ledger. This registry stores the pre-deployed split contract addresses that
//! were created off-chain (via the CLI), which is the recommended pattern for
//! production Soroban applications where each track gets its own contract
//! instance deployed by the CLI tool before registration.

#![no_std]

mod error;
mod types;

#[cfg(test)]
mod test;

use error::Error;
use soroban_sdk::{
    contract, contractimpl, symbol_short, Address, Env, String, Vec,
};
use types::{DataKey, Split, TrackInfo};

#[contract]
pub struct TrackRegistryContract;

/// External interface for the RoyaltySplitContract (cross-contract call client).
mod split_contract {
    use soroban_sdk::{contractclient, Address, Env, String};

    /// Minimal interface for cross-contract calls into RoyaltySplitContract.
    #[contractclient(name = "SplitContractClient")]
    pub trait SplitContract {
        fn get_track_id(env: Env) -> Result<String, soroban_sdk::Error>;
        fn distribute(
            env: Env,
            payer: Address,
            token_address: Address,
            amount: i128,
        ) -> Result<(), soroban_sdk::Error>;
        fn get_splits(env: Env) -> Result<soroban_sdk::Vec<super::Split>, soroban_sdk::Error>;
    }
}

#[contractimpl]
impl TrackRegistryContract {
    /// Initialize the registry with an admin address.
    ///
    /// # Errors
    /// - [`Error::AlreadyInitialized`] if called more than once.
    pub fn initialize(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Initialized) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Initialized, &true);
        env.storage().instance().set(&DataKey::TrackCount, &0u32);
        env.storage()
            .instance()
            .set(&DataKey::TrackList, &Vec::<String>::new(&env));
        Ok(())
    }

    /// Register a track by linking it to a pre-deployed split contract.
    ///
    /// The `split_contract_address` must be a deployed `RoyaltySplitContract`
    /// whose `track_id` matches `track_id`. This is verified via cross-contract
    /// call.
    ///
    /// # Errors
    /// - [`Error::NotInitialized`] if registry is not set up.
    /// - [`Error::TrackAlreadyExists`] if `track_id` is already registered.
    /// - [`Error::InvalidSplits`] if cross-contract verification fails.
    pub fn register_track(
        env: Env,
        admin: Address,
        track_id: String,
        split_contract_address: Address,
    ) -> Result<(), Error> {
        Self::require_initialized(&env)?;
        admin.require_auth();

        if env
            .storage()
            .instance()
            .has(&DataKey::Track(track_id.clone()))
        {
            return Err(Error::TrackAlreadyExists);
        }

        // Cross-contract call: verify the split contract matches this track_id
        let split_client =
            split_contract::SplitContractClient::new(&env, &split_contract_address);
        let reported_id = split_client
            .get_track_id()
            .map_err(|_| Error::InvalidSplits)?;
        if reported_id != track_id {
            return Err(Error::InvalidSplits);
        }

        let info = TrackInfo {
            track_id: track_id.clone(),
            split_contract: split_contract_address.clone(),
            admin: admin.clone(),
            registered_at: env.ledger().sequence(),
        };

        env.storage()
            .instance()
            .set(&DataKey::Track(track_id.clone()), &info);

        // Append to track list for pagination
        let mut track_list: Vec<String> = env
            .storage()
            .instance()
            .get(&DataKey::TrackList)
            .unwrap_or_else(|| Vec::new(&env));
        track_list.push_back(track_id.clone());
        env.storage()
            .instance()
            .set(&DataKey::TrackList, &track_list);

        let count: u32 = env
            .storage()
            .instance()
            .get(&DataKey::TrackCount)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::TrackCount, &(count + 1));

        env.events().publish(
            (symbol_short!("register"), track_id),
            (admin, split_contract_address),
        );

        Ok(())
    }

    /// Forward a royalty payment to a track's split contract.
    ///
    /// Demonstrates cross-contract calls: this method calls `distribute` on
    /// the appropriate `RoyaltySplitContract`.
    ///
    /// # Errors
    /// - [`Error::NotInitialized`] if registry is not set up.
    /// - [`Error::TrackNotFound`] if `track_id` is not registered.
    pub fn pay_track(
        env: Env,
        payer: Address,
        track_id: String,
        token_address: Address,
        amount: i128,
    ) -> Result<(), Error> {
        Self::require_initialized(&env)?;
        payer.require_auth();

        let info: TrackInfo = env
            .storage()
            .instance()
            .get(&DataKey::Track(track_id.clone()))
            .ok_or(Error::TrackNotFound)?;

        let split_client =
            split_contract::SplitContractClient::new(&env, &info.split_contract);

        // Cross-contract call into the split contract
        split_client
            .distribute(&payer, &token_address, &amount)
            .map_err(|_| Error::InvalidSplits)?;

        env.events()
            .publish((symbol_short!("pay"), track_id), (payer, amount));

        Ok(())
    }

    /// Retrieve metadata for a specific track.
    ///
    /// # Errors
    /// - [`Error::NotInitialized`] if registry is not set up.
    /// - [`Error::TrackNotFound`] if `track_id` is not registered.
    pub fn get_track(env: Env, track_id: String) -> Result<TrackInfo, Error> {
        Self::require_initialized(&env)?;
        env.storage()
            .instance()
            .get(&DataKey::Track(track_id))
            .ok_or(Error::TrackNotFound)
    }

    /// Return a paginated list of track IDs.
    ///
    /// # Errors
    /// - [`Error::NotInitialized`] if registry is not set up.
    pub fn list_tracks(
        env: Env,
        offset: u32,
        limit: u32,
    ) -> Result<Vec<TrackInfo>, Error> {
        Self::require_initialized(&env)?;

        let track_list: Vec<String> = env
            .storage()
            .instance()
            .get(&DataKey::TrackList)
            .unwrap_or_else(|| Vec::new(&env));

        let mut results = Vec::new(&env);
        let total = track_list.len();

        for i in offset..core::cmp::min(offset.saturating_add(limit), total) {
            if let Some(track_id) = track_list.get(i) {
                if let Some(info) = env
                    .storage()
                    .instance()
                    .get(&DataKey::Track(track_id))
                {
                    results.push_back(info);
                }
            }
        }

        Ok(results)
    }

    /// Return the total number of registered tracks.
    ///
    /// # Errors
    /// - [`Error::NotInitialized`] if registry is not set up.
    pub fn track_count(env: Env) -> Result<u32, Error> {
        Self::require_initialized(&env)?;
        Ok(env
            .storage()
            .instance()
            .get(&DataKey::TrackCount)
            .unwrap_or(0))
    }

    // --- Private helpers ---

    fn require_initialized(env: &Env) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Initialized) {
            Ok(())
        } else {
            Err(Error::NotInitialized)
        }
    }
}

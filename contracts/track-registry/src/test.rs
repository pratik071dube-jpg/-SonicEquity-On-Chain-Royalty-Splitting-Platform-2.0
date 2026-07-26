#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_registry_initialize() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let contract_id = env.register(TrackRegistryContract, ());
    let client = TrackRegistryContractClient::new(&env, &contract_id);

    client.initialize(&admin).unwrap();
    assert_eq!(client.track_count().unwrap(), 0);
}

#[test]
fn test_registry_double_initialize_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let contract_id = env.register(TrackRegistryContract, ());
    let client = TrackRegistryContractClient::new(&env, &contract_id);

    client.initialize(&admin).unwrap();
    assert!(client.try_initialize(&admin).is_err());
}

#[test]
fn test_get_nonexistent_track_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let contract_id = env.register(TrackRegistryContract, ());
    let client = TrackRegistryContractClient::new(&env, &contract_id);

    client.initialize(&admin).unwrap();

    let result = client.try_get_track(&String::from_str(&env, "nonexistent"));
    assert!(result.is_err());
}

#[test]
fn test_list_tracks_empty() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let contract_id = env.register(TrackRegistryContract, ());
    let client = TrackRegistryContractClient::new(&env, &contract_id);

    client.initialize(&admin).unwrap();
    let tracks = client.list_tracks(&0, &10).unwrap();
    assert_eq!(tracks.len(), 0);
}

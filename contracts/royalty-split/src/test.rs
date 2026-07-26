#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, AuthorizedFunction, AuthorizedInvocation},
    token, Address, Env, String, Vec,
};

/// Helper: create a test environment with mock token and split contract.
struct TestSetup {
    env: Env,
    contract_id: Address,
    token_id: Address,
    admin: Address,
    collab1: Address,
    collab2: Address,
    collab3: Address,
}

impl TestSetup {
    fn new() -> Self {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let collab1 = Address::generate(&env);
        let collab2 = Address::generate(&env);
        let collab3 = Address::generate(&env);

        let token_id = env.register_stellar_asset_contract_v2(admin.clone()).address();
        let contract_id = env.register(RoyaltySplitContract, ());

        // Mint tokens to admin for testing payments
        let token_admin = token::StellarAssetClient::new(&env, &token_id);
        token_admin.mint(&admin, &1_000_000_0000000); // 1M XLM in stroops

        Self { env, contract_id, token_id, admin, collab1, collab2, collab3 }
    }

    fn client(&self) -> RoyaltySplitContractClient {
        RoyaltySplitContractClient::new(&self.env, &self.contract_id)
    }

    fn make_splits_3way(&self) -> Vec<Split> {
        // 40% + 35% + 25% = 100% in basis points
        soroban_sdk::vec![
            &self.env,
            Split { address: self.admin.clone(), share_bps: 4_000 },
            Split { address: self.collab1.clone(), share_bps: 3_500 },
            Split { address: self.collab2.clone(), share_bps: 2_500 },
        ]
    }
}

#[test]
fn test_initialize_success() {
    let setup = TestSetup::new();
    let client = setup.client();
    let track_id = String::from_str(&setup.env, "track-001");

    client
        .initialize(&track_id, &setup.admin, &setup.make_splits_3way())
        .expect("initialize should succeed");

    assert_eq!(
        client.get_track_id().expect("track_id should exist"),
        track_id
    );
    assert_eq!(
        client.get_admin().expect("admin should exist"),
        setup.admin
    );
}

#[test]
fn test_initialize_rejects_double_init() {
    let setup = TestSetup::new();
    let client = setup.client();
    let track_id = String::from_str(&setup.env, "track-001");

    client.initialize(&track_id, &setup.admin, &setup.make_splits_3way()).unwrap();

    let result = client.try_initialize(&track_id, &setup.admin, &setup.make_splits_3way());
    assert!(result.is_err(), "second initialize should fail");
}

#[test]
fn test_invalid_split_total() {
    let setup = TestSetup::new();
    let client = setup.client();
    let track_id = String::from_str(&setup.env, "track-002");

    // Only sums to 9_000 bps
    let bad_splits = soroban_sdk::vec![
        &setup.env,
        Split { address: setup.admin.clone(), share_bps: 5_000 },
        Split { address: setup.collab1.clone(), share_bps: 4_000 },
    ];

    let result = client.try_initialize(&track_id, &setup.admin, &bad_splits);
    assert!(result.is_err(), "bad split total should be rejected");
}

#[test]
fn test_distribute_three_way_split() {
    let setup = TestSetup::new();
    let client = setup.client();
    let track_id = String::from_str(&setup.env, "track-003");

    client.initialize(&track_id, &setup.admin, &setup.make_splits_3way()).unwrap();

    let token_client = token::Client::new(&setup.env, &setup.token_id);
    let admin_balance_before = token_client.balance(&setup.admin);

    // Pay 1000 stroops — should split exactly 400 / 350 / 250
    let payment: i128 = 1000;
    client
        .distribute(&setup.admin, &setup.token_id, &payment)
        .expect("distribute should succeed");

    let admin_delta = token_client.balance(&setup.admin) - (admin_balance_before - payment);
    assert_eq!(admin_delta, 400, "admin should receive 400 stroops (40%)");
    assert_eq!(token_client.balance(&setup.collab1), 350, "collab1 should receive 350 stroops (35%)");
    assert_eq!(token_client.balance(&setup.collab2), 250, "collab2 should receive 250 stroops (25%)");
}

#[test]
fn test_distribute_rounding_remainder_goes_to_first() {
    let setup = TestSetup::new();
    let client = setup.client();
    let track_id = String::from_str(&setup.env, "track-004");

    // 33.33...% each — indivisible by 3
    let splits_thirds = soroban_sdk::vec![
        &setup.env,
        Split { address: setup.admin.clone(), share_bps: 3_334 },  // gets remainder
        Split { address: setup.collab1.clone(), share_bps: 3_333 },
        Split { address: setup.collab2.clone(), share_bps: 3_333 },
    ];

    client.initialize(&track_id, &setup.admin, &splits_thirds).unwrap();

    let token_client = token::Client::new(&setup.env, &setup.token_id);
    let admin_balance_before = token_client.balance(&setup.admin);

    // Pay 10 stroops — 3.334 + 3.333 + 3.333, integer division causes remainder
    let payment: i128 = 10;
    client.distribute(&setup.admin, &setup.token_id, &payment).unwrap();

    let collab1_share = (payment * 3_333) / 10_000; // = 3
    let collab2_share = (payment * 3_333) / 10_000; // = 3
    let remainder = payment - collab1_share - collab2_share; // = 4

    let admin_received =
        token_client.balance(&setup.admin) - (admin_balance_before - payment);
    assert_eq!(admin_received, remainder, "admin gets remainder");
    assert_eq!(token_client.balance(&setup.collab1), collab1_share);
    assert_eq!(token_client.balance(&setup.collab2), collab2_share);
    // Total must be conserved
    assert_eq!(admin_received + collab1_share + collab2_share, payment);
}

#[test]
fn test_distribute_invalid_amount() {
    let setup = TestSetup::new();
    let client = setup.client();
    let track_id = String::from_str(&setup.env, "track-005");

    client.initialize(&track_id, &setup.admin, &setup.make_splits_3way()).unwrap();

    let result = client.try_distribute(&setup.admin, &setup.token_id, &0i128);
    assert!(result.is_err(), "zero amount should fail");
}

#[test]
fn test_zero_share_split_rejected() {
    let setup = TestSetup::new();
    let client = setup.client();
    let track_id = String::from_str(&setup.env, "track-006");

    let bad_splits = soroban_sdk::vec![
        &setup.env,
        Split { address: setup.admin.clone(), share_bps: 10_000 },
        Split { address: setup.collab1.clone(), share_bps: 0 },
    ];

    let result = client.try_initialize(&track_id, &setup.admin, &bad_splits);
    assert!(result.is_err(), "zero-share split should be rejected");
}

#[test]
fn test_not_initialized_errors() {
    let setup = TestSetup::new();
    let client = setup.client();

    assert!(client.try_get_track_id().is_err());
    assert!(client.try_get_splits().is_err());
    assert!(client.try_get_admin().is_err());
    assert!(client.try_distribute(&setup.admin, &setup.token_id, &100i128).is_err());
}

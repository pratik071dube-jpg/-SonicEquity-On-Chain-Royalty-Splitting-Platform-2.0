# SonicEquity — Full Technical Architecture & Documentation

Welcome to the full technical documentation for **SonicEquity** (On-Chain Royalty Splitting Platform for Musicians on Stellar / Soroban).

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Smart Contract Deep Dive](#smart-contract-deep-dive)
3. [Backend API & Event Indexer](#backend-api--event-indexer)
4. [Frontend Application Architecture](#frontend-application-architecture)
5. [Sonic Equity Design System](#sonic-equity-design-system)
6. [Testing & Verification Strategy](#testing--verification-strategy)
7. [Production Deployment & Mainnet Migration](#production-deployment--mainnet-migration)

---

## 1. System Architecture

SonicEquity separates concerns across four distinct, independently testable layers:

```
┌─────────────────────────────────────────────────────────┐
│                      Next.js 14 Frontend                │
│  Dashboard ─── Splits ─── Payment History ─── Payouts   │
└──────────────┬──────────────────────────┬───────────────┘
               │ Freighter Wallet API     │ REST + SSE
               ▼                          ▼
┌──────────────────────┐     ┌─────────────────────────────┐
│  Soroban RPC         │     │   Axum API Server (Rust)    │
│  (Testnet)           │     │   • GET /tracks             │
│                      │     │   • GET /tracks/:id/events  │
└──────────┬───────────┘     └──────────┬──────────────────┘
           │                            │ writes
           │ getEvents (poll) ┌─────────▼──────────┐
           │◄─────────────────│   SQLite Database   │
           │                  │   (royalty.db)      │
           │                  └────────────────────┘
           │
  ┌────────▼──────────────────────┐
  │     Stellar Testnet Ledger     │
  │                               │
  │  ┌──────────────────────┐     │
  │  │ TrackRegistryContract│     │
  │  │  register_track()    │     │
  │  │  pay_track() ───┐    │     │
  │  └─────────────────│────┘     │
  │                    │ cross-contract call
  │  ┌─────────────────▼────┐     │
  │  │ RoyaltySplitContract │     │
  │  │  distribute()        │     │
  │  │  ├─ 40% → Producer   │     │
  │  │  ├─ 35% → Vocalist   │     │
  │  │  └─ 25% → Mixer      │     │
  │  └──────────────────────┘     │
  └───────────────────────────────┘
```

---

## 2. Smart Contract Deep Dive

### `RoyaltySplitContract` (`contracts/royalty-split`)

Written in idiomatic Rust using `soroban-sdk` 22.0.

#### Key Invariants & Design Choices
1. **Basis Point Math**: Shares are defined in basis points (BPS), where $10,000 \text{ BPS} = 100\%$. Floating point arithmetic is forbidden in Soroban contracts to ensure strict determinism.
2. **Dust Conservation**: Integer division remainders accrue to the track administrator ($1^{\text{st}}$ collaborator entry), preserving 100% of incoming token amounts down to single stroops.
3. **Multi-Sig Consent**:
   - Collaborators register consent using `approve_split_update(approver, sha256_hash)`.
   - `update_splits(admin, new_splits, hash)` checks that every current collaborator has registered a matching consent hash before mutating storage.

---

## 3. Backend API & Event Indexer

The backend contains two Rust binaries sharing a single SQLite database (`sqlx`):

1. **`royalty-api`**:
   - Axum 0.8 REST endpoints for tracks, payment history, and collaborator earnings.
   - SSE stream (`GET /tracks/:id/events`) pushing real-time payment events to subscribed clients.
   - CORS, body size limits (1 MB), and structured JSON logging via `tracing`.

2. **`royalty-indexer`**:
   - Polls Soroban RPC `getEvents` every 5 seconds.
   - Parses contract events (`PaymentDistributed`, `TrackRegistered`).
   - Writes payment events to SQLite and broadcasts them to the active SSE channel.

---

## 4. Frontend Application Architecture

Built using **Next.js 14 App Router** with TypeScript, Framer Motion, and Recharts.

### Error Handling System (`lib/errors.ts`)

Categorizes all potential application errors into three distinct user-facing types:

```typescript
export type ErrorCategory = 'wallet' | 'contract' | 'validation' | 'network';

export type ErrorCode =
  // 1. Wallet errors
  | 'FREIGHTER_NOT_INSTALLED'
  | 'WALLET_NOT_CONNECTED'
  | 'WRONG_NETWORK'
  | 'USER_REJECTED'
  // 2. Contract errors
  | 'CONTRACT_REVERT'
  | 'CONTRACT_INVALID_SPLITS'
  | 'CONTRACT_UNAUTHORIZED'
  // 3. Validation errors
  | 'INVALID_ADDRESS'
  | 'SPLITS_NOT_100'
  | 'ZERO_SHARE'
  | 'INVALID_AMOUNT';
```

---

## 5. Sonic Equity Design System

The application styling follows the **Sonic Equity** visual theme:

- **Background**: Midnight Navy (`#0b1326`)
- **Primary Accent**: Electric Violet (`#d0bcff` / `#a078ff`)
- **Secondary Accent**: Teal (`#44e2cd` / `#03c6b2`)
- **Tertiary Accent**: Rose (`#ffafd3`)
- **Typography**: `Hanken Grotesk` (headings/UI) & `Geist` (monospaced numeric data, BPS, transaction hashes).
- **Glassmorphism**: Backdrop blur (`20px`) with semi-transparent panel backgrounds (`rgba(23, 31, 51, 0.75)`).

---

## 6. Testing & Verification Strategy

```bash
# Workspace unit tests
cargo test --workspace

# Contract mock environment tests (Soroban testutils)
cargo test -p royalty-split --features testutils
cargo test -p track-registry --features testutils

# Frontend Jest unit tests
cd frontend && npm test
```

---

## 7. Production Deployment & Mainnet Migration

To migrate from Stellar Testnet to Mainnet:

1. Update `SOROBAN_RPC_URL` to a mainnet RPC provider.
2. Update `STELLAR_NETWORK` environment variable to `PUBLIC`.
3. Re-deploy WASM contract binaries using `infra/.github/workflows/deploy-contracts.yml` configured for mainnet.
4. Record newly generated contract addresses in `.env.production`.

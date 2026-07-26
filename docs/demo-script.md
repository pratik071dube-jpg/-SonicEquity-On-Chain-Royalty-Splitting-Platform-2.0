# Demo Script — StellarSplit Platform

This walkthrough demonstrates the complete user flow from wallet connection to real-time royalty distribution.

---

## Prerequisites

1. **Freighter wallet** installed and set to **Stellar Testnet**
2. Backend API running on `http://localhost:3001`
3. Contracts deployed (see README Quick Start)
4. Frontend running on `http://localhost:3000`

---

## Step 1 — Connect Wallet

1. Open `http://localhost:3000` in Chrome/Brave with Freighter installed
2. Click **"Connect Wallet"** in the header
3. Freighter popup appears → click **"Connect"**
4. Wallet state updates instantly:
   - Header shows shortened address (e.g., `GBBD47...LA5`)
   - Green online dot appears
   - XLM balance displays on the hero section
5. Click the address in the header to see the dropdown with full address and **Disconnect** button

**What to show:** The centralized `useWallet` hook drives all state. Balance auto-refreshes every 30 seconds. Try clicking the refresh icon on the balance card.

---

## Step 2 — Register a Track with 3-Way Split

1. Navigate to **Tracks** (`/tracks`)
2. Click **"New Track"**
3. In the TrackCreator form:
   - Track Name: `summer-collab-2024`
   - Collaborator 1: Your wallet address — **40%**
   - Click **+ Add Collaborator**
   - Collaborator 2: Any valid testnet G-address — **35%**
   - Click **+ Add Collaborator**
   - Collaborator 3: Another testnet G-address — **25%**

4. Watch the **progress bar** fill to 100% and the percentage counter turn green
5. Click **"Register Track"**
6. Freighter popup → Approve the transaction
7. Transaction status badge shows: `Pending` → `Submitted` → `Confirmed`
8. Contract address link appears — click to view on **Stellar Expert**

**What to show:** The validation layer prevents submission with % ≠ 100%, invalid addresses, or zero shares. Try deliberately entering wrong percentages to see the error.

---

## Step 3 — Simulate a Royalty Payment

1. Navigate to the track dashboard (`/tracks/summer-collab-2024`)
2. Click **"Send Royalty Payment"**
3. Enter amount: `100` XLM
4. Click **"Send Payment"**
5. Approve in Freighter
6. Watch the transaction status flow: `Pending` → `Submitted` → `Confirmed`
7. Transaction hash appears with a **"View on Stellar Expert"** link
8. Click the link to verify the transaction on-chain

**Expected splits from 100 XLM:**
- Collaborator 1 (admin): **40 XLM** (receives rounding remainder)
- Collaborator 2: **35 XLM**
- Collaborator 3: **25 XLM**

*Note: amounts are in stroops internally — 100 XLM = 1,000,000,000 stroops*

---

## Step 4 — Real-Time Payment Feed

1. Open two browser windows side-by-side
2. Window A: Track dashboard (`/tracks/summer-collab-2024`)
3. Window B: Also the track dashboard (or collaborator 2's wallet connected)

4. In Window A, click **"Send Royalty Payment"** and send 50 XLM
5. In Window B: The **"Live Feed"** panel updates **instantly** without a page refresh

**What to show:** The SSE stream (`GET /tracks/:id/events`) pushes events as soon as the indexer processes them from the Soroban ledger. No polling, no manual refresh.

---

## Step 5 — Error Handling Demo

Show each of the three error categories:

**Wallet Error:**
1. Switch Freighter to Mainnet
2. Try to navigate to `/tracks`
3. NetworkGuard component shows: *"You are connected to PUBLIC. Please switch to Stellar Testnet."*

**Validation Error:**
1. In TrackCreator, set percentages to 50% + 30% = 80%
2. Try to deploy
3. Error: *"Percentages sum to 80.00% — must be exactly 100%"*

**Contract Error:**
1. Try sending 0 XLM in the payment form
2. Error: *"Payment amount must be greater than 0 XLM."*

---

## Step 6 — Collaborator Dashboard

1. Navigate to `/collaborator/G.../earnings` (replace with a collaborator address)
2. API returns total earnings across all tracks
3. Breakdown shows per-track earnings and payment count

---

## Key Architecture Points to Highlight

| Point | Where to show |
|-------|--------------|
| Basis-point math (no floating point) | Contract source `contracts/royalty-split/src/lib.rs` L65-90 |
| Cross-contract calls | `contracts/track-registry/src/lib.rs` — `pay_track` calls `split_client.distribute()` |
| SSE real-time feed | `backend/api/src/routes/events.rs` + `frontend/hooks/useSSE.ts` |
| 3 error categories | `frontend/lib/errors.ts` — `ErrorCode` union type |
| Rounding test | `contracts/royalty-split/src/test.rs` — `test_distribute_rounding_remainder_goes_to_first` |
| Freighter integration | `frontend/lib/freighter.ts` |

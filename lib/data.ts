import { DollarSign, Music, Users } from 'lucide-react';

export interface StatItem {
  label: string;
  value: string;
  growth: string;
  icon: typeof DollarSign;
  color: string;
}

export interface TopTrack {
  id: string;
  streams: string;
  revenue: string;
  splits: string;
  status: string;
}

export interface TransactionRecord {
  tx_hash: string;
  track_id: string;
  payer: string;
  total_amount: number;
  paid_at: string;
  ledger_sequence: number;
  status: 'confirmed' | 'pending' | 'failed';
  splits_count: number;
}

export interface PayoutLog {
  id: string;
  amount: string;
  asset: string;
  destination: string;
  date: string;
  status: 'Completed' | 'Processing';
  txHash: string;
}

export interface TrackSplitSample {
  track_id: string;
  split_contract: string;
  admin: string;
  status: string;
  collaborators: Array<{
    role: string;
    pct: string;
    bps: string;
    addr: string;
  }>;
}

export const STATS_DATA: StatItem[] = [
  { label: 'Total Revenue Distributed', value: '4,850.00 XLM', growth: '+18.4%', icon: DollarSign, color: 'var(--accent-secondary)' },
  { label: 'Active Royalty Tracks', value: '12 Tracks', growth: '+3 this month', icon: Music, color: 'var(--accent-primary)' },
  { label: 'Registered Collaborators', value: '28 Rights Holders', growth: 'Multi-sig verified', icon: Users, color: 'var(--accent-tertiary)' },
];

export const TOP_TRACKS_DATA: TopTrack[] = [
  { id: 'Midnight-Pulse-EP', streams: '1.2M', revenue: '1,450 XLM', splits: '40% / 35% / 25%', status: 'ON-CHAIN VERIFIED' },
  { id: 'Neon-Horizon-Single', streams: '840K', revenue: '890 XLM', splits: '50% / 50%', status: 'ON-CHAIN VERIFIED' },
  { id: 'Velvet-Echoes', streams: '410K', revenue: '320 XLM', splits: '60% / 40%', status: 'ON-CHAIN VERIFIED' },
];

export const MOCK_TRANSACTIONS: TransactionRecord[] = [
  {
    tx_hash: '9d8f7e6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e',
    track_id: 'Midnight-Pulse-EP',
    payer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    total_amount: 1450000000,
    paid_at: '2026-07-24T15:30:00Z',
    ledger_sequence: 54932104,
    status: 'confirmed',
    splits_count: 3,
  },
  {
    tx_hash: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    track_id: 'Neon-Horizon-Single',
    payer: 'GCCC3333333333333333333333333333333333333333333333333333',
    total_amount: 890000000,
    paid_at: '2026-07-24T14:15:00Z',
    ledger_sequence: 54931890,
    status: 'confirmed',
    splits_count: 4,
  },
  {
    tx_hash: '3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e',
    track_id: 'Velvet-Echoes',
    payer: 'GBBR2222222222222222222222222222222222222222222222222222',
    total_amount: 320000000,
    paid_at: '2026-07-24T12:00:00Z',
    ledger_sequence: 54931200,
    status: 'confirmed',
    splits_count: 2,
  },
  {
    tx_hash: '5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b',
    track_id: 'Midnight-Pulse-EP',
    payer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    total_amount: 500000000,
    paid_at: '2026-07-24T10:45:00Z',
    ledger_sequence: 54930500,
    status: 'pending',
    splits_count: 3,
  },
];

export const MOCK_PAYOUTS: PayoutLog[] = [
  {
    id: 'PO-9081',
    amount: '145.00',
    asset: 'XLM',
    destination: 'GBBD47...LA5',
    date: '2026-07-24 15:30',
    status: 'Completed',
    txHash: '9d8f7e6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e',
  },
  {
    id: 'PO-9080',
    amount: '89.50',
    asset: 'XLM',
    destination: 'GBBD47...LA5',
    date: '2026-07-24 14:15',
    status: 'Completed',
    txHash: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
  },
  {
    id: 'PO-9079',
    amount: '32.00',
    asset: 'XLM',
    destination: 'GBBD47...LA5',
    date: '2026-07-24 12:00',
    status: 'Completed',
    txHash: '3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e',
  },
];

export const SAMPLE_SPLITS: TrackSplitSample[] = [
  {
    track_id: 'Midnight-Pulse-EP',
    split_contract: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
    admin: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    status: 'VERIFIED',
    collaborators: [
      { role: 'Producer (Admin)', pct: '40%', bps: '4000 BPS', addr: 'GBBD47...LA5' },
      { role: 'Vocalist', pct: '35%', bps: '3500 BPS', addr: 'GBBR22...222' },
      { role: 'Mixing Engineer', pct: '25%', bps: '2500 BPS', addr: 'GCCC33...333' },
    ],
  },
  {
    track_id: 'Neon-Horizon-Single',
    split_contract: 'CBA9876543210FEDCBA9876543210FEDCBA9876543210FEDCBA98765',
    admin: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    status: 'VERIFIED',
    collaborators: [
      { role: 'Songwriter', pct: '50%', bps: '5000 BPS', addr: 'GBBD47...LA5' },
      { role: 'Beatmaker', pct: '50%', bps: '5000 BPS', addr: 'GCCC33...333' },
    ],
  },
];

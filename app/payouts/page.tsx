'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Download,
  Filter,
  RefreshCw,
  CheckCircle2,
  Zap,
  Disc,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { PrimaryButton, GhostButton } from '@/components/ui/Buttons';
import { StatusChip } from '@/components/ui/StatusChip';
import { ClaimRoyaltiesModal } from '@/components/ui/ClaimRoyaltiesModal';
import { useWallet } from '@/hooks/useWallet';
import { shortenAddress, stellarExpertTxLink } from '@/lib/stellar';

export default function WalletPage() {
  const { isConnected, publicKey, balanceXlm, refreshBalance } = useWallet();
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'ROYALTIES' | 'TRANSFERS'>('ALL');

  const xlmAmount = isConnected && balanceXlm ? parseFloat(balanceXlm) : 12482.90;
  const xlmUsd = (xlmAmount * 0.115).toFixed(2);

  const assetHoldings = [
    {
      symbol: 'XLM',
      name: 'Stellar Native',
      balance: xlmAmount.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      usdValue: `$${xlmUsd}`,
      icon: Wallet,
      color: '#44e2cd',
    },
    {
      symbol: 'MNP-EQT',
      name: 'Midnight Pulse EP Share Token',
      balance: '4,000.00',
      usdValue: '$460.00',
      icon: Disc,
      color: '#d0bcff',
    },
    {
      symbol: 'NEON-LP',
      name: 'Neon Horizon Rights Pool',
      balance: '5,000.00',
      usdValue: '$575.00',
      icon: Layers,
      color: '#ffafd3',
    },
  ];

  const activityEvents = [
    {
      id: 'evt-1',
      title: 'Midnight Pulse EP Royalty Distribution',
      category: 'ROYALTIES',
      sign: '+',
      amountXlm: '1240.12',
      usdVal: '$142.61',
      source: 'CDLZFC...CYSC',
      timestamp: '2026-07-26 10:30:12 UTC',
      tag: 'AUTOMATED',
      txHash: '9d8f7e6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e',
    },
    {
      id: 'evt-2',
      title: 'Royalty Claim Withdrawal to Freighter',
      category: 'TRANSFERS',
      sign: '-',
      amountXlm: '450.00',
      usdVal: '$51.75',
      source: 'GBBD47...LA5',
      timestamp: '2026-07-25 18:45:00 UTC',
      tag: 'ON-CHAIN',
      txHash: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    },
    {
      id: 'evt-3',
      title: 'Neon Horizon Equity Buyback Disbursement',
      category: 'ROYALTIES',
      sign: '+',
      amountXlm: '850.00',
      usdVal: '$97.75',
      source: 'CBA987...765',
      timestamp: '2026-07-24 14:15:30 UTC',
      tag: 'AUTOMATED',
      txHash: '3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e',
    },
    {
      id: 'evt-4',
      title: 'SonicEquity Staking Platform Reward',
      category: 'ROYALTIES',
      sign: '+',
      amountXlm: '125.50',
      usdVal: '$14.43',
      source: 'Platform Rewards Pool',
      timestamp: '2026-07-23 09:12:00 UTC',
      tag: 'CONFIRMED',
      txHash: '5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b',
    },
  ];

  const filteredEvents = activityEvents.filter((evt) => {
    if (filterType === 'ALL') return true;
    return evt.category === filterType;
  });

  const downloadCsvHistory = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['ID,Title,Category,Sign,Amount_XLM,USD_Value,Source,Timestamp,TxHash']
        .concat(
          activityEvents.map(
            (e) => `${e.id},"${e.title}",${e.category},${e.sign},${e.amountXlm},${e.usdVal},${e.source},"${e.timestamp}",${e.txHash}`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sonicequity_wallet_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px 60px' }}>
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <StatusChip status="LIVE" />
            <span className="data-mono" style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
              STELLAR TESTNET WALLET HUB
            </span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--on-surface)' }}>
            Wallet & <span className="gradient-text">Asset Payouts</span>
          </h1>
        </div>

        <GhostButton size="sm" onClick={refreshBalance} icon={<RefreshCw size={14} />}>
          Sync Wallet Balance
        </GhostButton>
      </div>

      {/* Hero Card: Total Equity Value */}
      <GlassCard variant="level3" glow style={{ padding: 32, marginBottom: 32, position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <span className="data-mono" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--on-surface-variant)' }}>
              Total Equity Value
            </span>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
              <span className="data-mono" style={{ fontSize: 44, fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>
                {xlmAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span style={{ fontSize: 24, color: 'var(--secondary)' }}>XLM</span>
              </span>
              <span className="data-mono" style={{ fontSize: 14, color: '#44e2cd', fontWeight: 600 }}>
                +14.2% this month
              </span>
            </div>

            <p className="data-mono" style={{ fontSize: 14, color: 'var(--on-surface-variant)', marginTop: 6 }}>
              ≈ ${xlmUsd} USD • Connected Address: {publicKey ? shortenAddress(publicKey, 8) : 'Freighter Testnet'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <PrimaryButton size="lg" onClick={() => setIsClaimModalOpen(true)} icon={<ArrowDownLeft size={18} />}>
              Withdraw Royalties
            </PrimaryButton>

            <GhostButton size="lg" onClick={() => alert('Deposit XLM to your wallet G-address via Stellar Testnet Friendbot.')} icon={<ArrowUpRight size={18} />}>
              Deposit Funds
            </GhostButton>
          </div>
        </div>
      </GlassCard>

      {/* Asset Holdings Section */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 16 }}>
          Asset Holdings & Rights Tokens
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {assetHoldings.map((asset) => {
            const IconComp = asset.icon;
            return (
              <GlassCard key={asset.symbol} variant="level2" style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: `${asset.color}22`,
                        border: `1px solid ${asset.color}44`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconComp size={22} color={asset.color} />
                    </div>

                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--on-surface)' }}>{asset.symbol}</h3>
                      <p style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>{asset.name}</p>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span className="data-mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--on-surface)' }}>
                    {asset.balance}
                  </span>
                  <span className="data-mono" style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>
                    {asset.usdValue}
                  </span>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </section>

      {/* Activity Log Section */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--on-surface)' }}>On-Chain Activity Log</h2>
            <p style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>Real-time contract events sorted newest-first</p>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {/* Filter buttons */}
            <div style={{ display: 'flex', gap: 4, background: 'rgba(11,19,38,0.8)', padding: 3, borderRadius: 8 }}>
              {(['ALL', 'ROYALTIES', 'TRANSFERS'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterType(cat)}
                  className="data-mono"
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    border: 'none',
                    background: filterType === cat ? 'var(--secondary-container)' : 'transparent',
                    color: filterType === cat ? '#00201c' : 'var(--on-surface-variant)',
                    cursor: 'pointer',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <GhostButton size="sm" onClick={downloadCsvHistory} icon={<Download size={14} />}>
              Export CSV
            </GhostButton>
          </div>
        </div>

        <GlassCard variant="level2" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredEvents.map((evt, idx) => (
              <div
                key={evt.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '20px 24px',
                  borderBottom: idx !== filteredEvents.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                  flexWrap: 'wrap',
                  gap: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      background: evt.sign === '+' ? 'rgba(68, 226, 205, 0.15)' : 'rgba(208, 188, 255, 0.15)',
                      border: evt.sign === '+' ? '1px solid rgba(68, 226, 205, 0.3)' : '1px solid rgba(208, 188, 255, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      fontWeight: 700,
                      color: evt.sign === '+' ? '#44e2cd' : '#d0bcff',
                    }}
                  >
                    {evt.sign === '+' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                  </div>

                  <div>
                    <h4 style={{ fontSize: 15, fontWeight: 600, color: 'var(--on-surface)' }}>{evt.title}</h4>
                    <p className="data-mono" style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 2 }}>
                      Source: {evt.source} • {evt.timestamp}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ textAlign: 'right' }}>
                    <p
                      className="data-mono"
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: evt.sign === '+' ? 'var(--secondary)' : 'var(--primary)',
                      }}
                    >
                      {evt.sign}
                      {evt.amountXlm} XLM
                    </p>
                    <span className="data-mono" style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
                      ≈ {evt.usdVal} USD
                    </span>
                  </div>

                  <a href={stellarExpertTxLink(evt.txHash)} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                    <StatusChip status={evt.tag} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>

      {/* Claim Royalties Modal */}
      <ClaimRoyaltiesModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        claimableAmountXlm={xlmAmount.toFixed(7)}
      />
    </div>
  );
}

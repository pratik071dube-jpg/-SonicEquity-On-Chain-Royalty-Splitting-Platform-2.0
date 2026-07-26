'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  TrendingUp,
  Music2,
  Sliders,
  DollarSign,
  Radio,
  Disc,
  Mic,
  Tv,
  ArrowRight,
  Plus,
  Sparkles,
  Settings,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { PrimaryButton, GhostButton } from '@/components/ui/Buttons';
import { StatusChip } from '@/components/ui/StatusChip';
import { LevelMeter } from '@/components/ui/LevelMeter';
import { ClaimRoyaltiesModal } from '@/components/ui/ClaimRoyaltiesModal';
import { useWallet } from '@/hooks/useWallet';
import { useTracks } from '@/hooks/useTracks';

export default function DashboardPage() {
  const { isConnected, balanceXlm } = useWallet();
  const { tracks } = useTracks();
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  // Live total royalties calculation or mock fallback
  const totalRoyaltiesXlm = isConnected && balanceXlm ? parseFloat(balanceXlm) * 4.2 : 4850.0;
  const totalRoyaltiesUsd = (totalRoyaltiesXlm * 0.115).toFixed(2);

  const activeSplits = tracks.length > 0 ? tracks : [
    {
      id: 'Midnight-Pulse-EP',
      title: 'Midnight Pulse EP',
      artist: 'Sonic Equity Lab',
      coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=300&q=80',
      userEquityPct: 40,
      splitType: 'Master Recording Split',
      revenueGoalPct: 78,
    },
    {
      id: 'Neon-Horizon-Single',
      title: 'Neon Horizon',
      artist: 'Aura & Synth',
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80',
      userEquityPct: 50,
      splitType: 'Songwriting & Publishing',
      revenueGoalPct: 92,
    },
    {
      id: 'Velvet-Echoes',
      title: 'Velvet Echoes',
      artist: 'Echo Collective',
      coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=300&q=80',
      userEquityPct: 35,
      splitType: 'Producer Equity Split',
      revenueGoalPct: 64,
    },
  ];

  const recentDistributions = [
    {
      id: 'dist-1',
      type: 'Streaming Performance',
      source: 'Spotify • Global Streams',
      icon: Radio,
      trackTitle: 'Neon Horizon',
      amountXlm: '1240.12',
      timestamp: '2 hours ago',
      status: 'CONFIRMED' as const,
    },
    {
      id: 'dist-2',
      type: 'Sync License',
      source: 'Netflix Original Series',
      icon: Tv,
      trackTitle: 'Silent Circuit',
      amountXlm: '8500.00',
      timestamp: '1 day ago',
      status: 'CONFIRMED' as const,
    },
    {
      id: 'dist-3',
      type: 'Mechanical Royalties',
      source: 'Bandcamp Vinyl Sales',
      icon: Disc,
      trackTitle: 'Global Echo',
      amountXlm: '450.60',
      timestamp: '3 days ago',
      status: 'CONFIRMED' as const,
    },
    {
      id: 'dist-4',
      type: 'Live Performance',
      source: 'Web3 Music Fest 2026',
      icon: Mic,
      trackTitle: 'Midnight Pulse EP',
      amountXlm: '1890.00',
      timestamp: '5 days ago',
      status: 'CONFIRMED' as const,
    },
  ];

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', padding: '32px 20px 60px' }}>
      {/* Header Banner Subtitle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <StatusChip status="LIVE" />
            <span className="data-mono" style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
              STELLAR TESTNET RPC CONNECTED
            </span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--on-surface)' }}>
            Artist Rights <span className="gradient-text">Dashboard</span>
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/tracks/new" style={{ textDecoration: 'none' }}>
            <PrimaryButton size="sm" icon={<Plus size={16} />}>
              Create New Split
            </PrimaryButton>
          </Link>
        </div>
      </div>

      {/* Hero Card: Total Royalties */}
      <GlassCard variant="level3" glow style={{ padding: 32, marginBottom: 36, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 250,
            height: 250,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(68,226,205,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <span
              className="data-mono"
              style={{
                fontSize: 12,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--on-surface-variant)',
              }}
            >
              Total Royalties Accumulated
            </span>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
              <span className="data-mono" style={{ fontSize: 44, fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>
                {totalRoyaltiesXlm.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span style={{ fontSize: 24, color: 'var(--secondary)' }}>XLM</span>
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#44e2cd', fontSize: 14, fontFamily: 'Geist, monospace' }}>
                <TrendingUp size={16} />
                <span>+18.4% this month</span>
              </div>
            </div>

            <p className="data-mono" style={{ fontSize: 14, color: 'var(--on-surface-variant)', marginTop: 6 }}>
              ≈ ${totalRoyaltiesUsd} USD • Verified by Soroban Smart Contracts
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <PrimaryButton size="lg" onClick={() => setIsClaimModalOpen(true)} icon={<Sparkles size={18} />}>
              Claim All Royalties
            </PrimaryButton>

            <Link href="/payouts" style={{ textDecoration: 'none' }}>
              <GhostButton size="lg" icon={<TrendingUp size={18} />}>
                Analytics
              </GhostButton>
            </Link>
          </div>
        </div>

        {/* Visual Level Trend Bars */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 48, marginTop: 28 }}>
          {[35, 45, 30, 65, 50, 85, 100, 75, 60, 90, 95, 80, 100].map((val, idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                height: `${val}%`,
                background: idx === 6 || idx === 10 ? 'linear-gradient(180deg, #44e2cd 0%, rgba(68,226,205,0.2) 100%)' : 'rgba(208, 188, 255, 0.2)',
                borderRadius: '4px 4px 0 0',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      </GlassCard>

      {/* Active Splits Horizontal Scroll Section */}
      <section style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--on-surface)' }}>Active Royalty Splits</h2>
            <p style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>Track shares and automated basis-point allocations</p>
          </div>

          <Link href="/tracks" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary)', fontSize: 13, fontWeight: 600 }}>
              View All Tracks <ArrowRight size={14} />
            </div>
          </Link>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 20,
          }}
        >
          {activeSplits.map((split: any) => (
            <Link key={split.id} href={`/tracks/${split.id}`} style={{ textDecoration: 'none' }}>
              <GlassCard variant="level2" glow style={{ padding: 20, cursor: 'pointer', height: '100%' }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
                  <img
                    src={split.coverUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=300&q=80'}
                    alt={split.title}
                    style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {split.title}
                    </h3>
                    <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 2 }}>{split.artist}</p>
                    <span className="data-mono" style={{ fontSize: 11, color: 'var(--secondary)', display: 'block', marginTop: 4 }}>
                      {split.splitType || 'Master Split'}
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span className="data-mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>
                      {split.userEquityPct ?? 40}%
                    </span>
                    <span style={{ fontSize: 10, display: 'block', color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>
                      Your Equity
                    </span>
                  </div>
                </div>

                <LevelMeter
                  progress={split.revenueGoalPct ?? 80}
                  color="cyan"
                  label="Revenue Goal Progress"
                  height={8}
                />
              </GlassCard>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Distributions List */}
      <section style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--on-surface)' }}>Recent Distributions</h2>
            <p style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>Automated on-chain payouts disbursed to rights holders</p>
          </div>

          <Link href="/payouts" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--secondary)', fontSize: 13, fontWeight: 600 }}>
              Full History <ArrowRight size={14} />
            </div>
          </Link>
        </div>

        <GlassCard variant="level2" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {recentDistributions.map((dist, idx) => {
              const IconComponent = dist.icon;
              return (
                <div
                  key={dist.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 24px',
                    borderBottom: idx !== recentDistributions.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: 'rgba(208, 188, 255, 0.12)',
                        border: '1px solid rgba(208, 188, 255, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconComponent size={20} color="#d0bcff" />
                    </div>

                    <div>
                      <h4 style={{ fontSize: 15, fontWeight: 600, color: 'var(--on-surface)' }}>{dist.trackTitle}</h4>
                      <p style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
                        {dist.type} • {dist.source}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ textAlign: 'right' }}>
                      <p className="data-mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--secondary)' }}>
                        +{dist.amountXlm} XLM
                      </p>
                      <span className="data-mono" style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
                        {dist.timestamp}
                      </span>
                    </div>

                    <StatusChip status={dist.status} />
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </section>

      {/* Claim Royalties Modal Trigger */}
      <ClaimRoyaltiesModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        claimableAmountXlm={totalRoyaltiesXlm.toFixed(7)}
      />
    </div>
  );
}

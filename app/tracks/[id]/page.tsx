'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Share2,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Disc,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { GlassCard } from '@/components/ui/GlassCard';
import { PrimaryButton, GhostButton } from '@/components/ui/Buttons';
import { StatusChip } from '@/components/ui/StatusChip';
import { LevelMeter } from '@/components/ui/LevelMeter';
import { ClaimRoyaltiesModal } from '@/components/ui/ClaimRoyaltiesModal';
import { useWallet } from '@/hooks/useWallet';
import { shortenAddress, stellarExpertContractLink } from '@/lib/stellar';

const PAYOUT_CHART_DATA = {
  '1M': [
    { date: 'Jul 1', amount: 120 },
    { date: 'Jul 5', amount: 340 },
    { date: 'Jul 10', amount: 210 },
    { date: 'Jul 15', amount: 680 },
    { date: 'Jul 20', amount: 950 },
    { date: 'Jul 25', amount: 1450 },
  ],
  '6M': [
    { date: 'Feb', amount: 450 },
    { date: 'Mar', amount: 890 },
    { date: 'Apr', amount: 1200 },
    { date: 'May', amount: 1980 },
    { date: 'Jun', amount: 2850 },
    { date: 'Jul', amount: 4290 },
  ],
  '1Y': [
    { date: 'Q3 2025', amount: 1200 },
    { date: 'Q4 2025', amount: 2400 },
    { date: 'Q1 2026', amount: 4100 },
    { date: 'Q2 2026', amount: 7800 },
    { date: 'Q3 2026', amount: 12450 },
  ],
};

export default function ProjectDetailsPage() {
  const params = useParams();
  const trackId = (params.id as string) || 'Midnight-Pulse-EP';
  const { isConnected, publicKey } = useWallet();

  const [timeRange, setTimeRange] = useState<'1M' | '6M' | '1Y'>('6M');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(35);
  const [copiedContract, setCopiedContract] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  const sorobanContractId = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

  const collaborators = [
    {
      role: 'Lead Producer (Admin)',
      pct: 40,
      bps: 4000,
      addr: publicKey || 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    },
    {
      role: 'Vocalist & Songwriter',
      pct: 35,
      bps: 3500,
      addr: 'GBBR2222222222222222222222222222222222222222222222222222',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    },
    {
      role: 'Mixing & Mastering Engineer',
      pct: 25,
      bps: 2500,
      addr: 'GCCC3333333333333333333333333333333333333333333333333333',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
    },
  ];

  const copyContractAddress = () => {
    navigator.clipboard.writeText(sorobanContractId);
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px 60px' }}>
      {/* Top Navigation */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/tracks" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--on-surface-variant)', fontSize: 14 }}>
          <ArrowLeft size={16} /> Back to Catalog
        </Link>
      </div>

      {/* Hero Media Panel */}
      <GlassCard variant="level3" glow style={{ padding: 32, marginBottom: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 28, alignItems: 'center' }}>
          {/* Cover Art / Visualization */}
          <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', aspectRatio: '1/1', border: '1px solid rgba(255,255,255,0.12)' }}>
            <img
              src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=600&q=80"
              alt="Track Artwork"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />

            {/* Glowing audio overlay effect */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, transparent 50%, rgba(11, 19, 38, 0.9) 100%)',
              }}
            />

            <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
              <StatusChip status="ON-CHAIN VERIFIED" />
            </div>
          </div>

          {/* Track Metadata & Scrubber */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <span className="data-mono" style={{ fontSize: 12, color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                MASTER RECORDING SPLIT
              </span>
              <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--on-surface)', marginTop: 4 }}>
                {trackId.replace(/-/g, ' ')}
              </h1>
              <p style={{ fontSize: 16, color: 'var(--on-surface-variant)', marginTop: 4 }}>
                Primary Artist: <span style={{ color: 'var(--on-surface)', fontWeight: 600 }}>Sonic Equity Lab</span> • Released Jul 2026
              </p>
            </div>

            {/* Your Equity Readout */}
            <div
              style={{
                background: 'rgba(11, 19, 38, 0.7)',
                border: '1px solid rgba(208, 188, 255, 0.2)',
                borderRadius: 12,
                padding: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span className="data-mono" style={{ fontSize: 11, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>YOUR CONNECTED EQUITY</span>
                <p className="data-mono" style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)' }}>
                  40.00% <span style={{ fontSize: 14, color: 'var(--on-surface-variant)' }}>(4000 BPS)</span>
                </p>
              </div>
              <Disc size={32} color="#44e2cd" className="animate-spin" style={{ animationDuration: isPlaying ? '3s' : '0s' }} />
            </div>

            {/* Interactive Audio Player Scrubber */}
            <div
              style={{
                background: 'rgba(23, 31, 51, 0.6)',
                borderRadius: 12,
                padding: 16,
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'var(--gradient-brand)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#060e20',
                  }}
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: 2 }} />}
                </button>

                <div style={{ flex: 1 }}>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={playbackProgress}
                    onChange={(e) => setPlaybackProgress(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#44e2cd', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'Geist, monospace', color: 'var(--on-surface-variant)', marginTop: 4 }}>
                    <span>01:14</span>
                    <span>03:28</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--on-surface-variant)',
                    cursor: 'pointer',
                  }}
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
              </div>
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
              <PrimaryButton onClick={() => setIsClaimModalOpen(true)} icon={<Sparkles size={16} />}>
                Collect Royalties
              </PrimaryButton>

              <GhostButton onClick={() => alert('Share equity link copied to clipboard!')} icon={<Share2 size={16} />}>
                Share Equity
              </GhostButton>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Split Breakdown & Payout Chart Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 28, marginBottom: 32 }}>
        {/* Split Breakdown List */}
        <GlassCard variant="level2" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--on-surface)' }}>
              Split Breakdown
            </h2>
            <StatusChip status="100% ALLOCATED" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {collaborators.map((c, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img
                      src={c.avatar}
                      alt={c.role}
                      style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--on-surface)' }}>{c.role}</p>
                      <p className="data-mono" style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
                        {shortenAddress(c.addr)}
                      </p>
                    </div>
                  </div>

                  <span className="data-mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--secondary)' }}>
                    {c.pct}.00%
                  </span>
                </div>

                <LevelMeter progress={c.pct} color={i === 0 ? 'violet' : i === 1 ? 'cyan' : 'tertiary'} height={6} animated={false} />
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Payout History Chart */}
        <GlassCard variant="level2" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--on-surface)' }}>Payout History</h2>
              <p style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>Peak Earnings: 1,450 XLM</p>
            </div>

            {/* Time range toggle */}
            <div style={{ display: 'flex', gap: 4, background: 'rgba(11,19,38,0.8)', padding: 3, borderRadius: 8 }}>
              {(['1M', '6M', '1Y'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className="data-mono"
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    border: 'none',
                    background: timeRange === range ? 'var(--primary-container)' : 'transparent',
                    color: timeRange === range ? '#060e20' : 'var(--on-surface-variant)',
                    cursor: 'pointer',
                  }}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: 200, width: '100%', marginTop: 12 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={PAYOUT_CHART_DATA[timeRange]}>
                <defs>
                  <linearGradient id="payoutGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#44e2cd" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#44e2cd" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#958ea0" fontSize={11} tickLine={false} />
                <YAxis stroke="#958ea0" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(19,27,46,0.95)',
                    border: '1px solid rgba(208,188,255,0.3)',
                    borderRadius: 8,
                    color: '#dae2fd',
                    fontFamily: 'Geist, monospace',
                  }}
                />
                <Area type="monotone" dataKey="amount" stroke="#44e2cd" strokeWidth={2} fillOpacity={1} fill="url(#payoutGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Smart Contract Info Card */}
      <GlassCard variant="level2" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'rgba(208, 188, 255, 0.15)',
                border: '1px solid rgba(208, 188, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={24} color="#d0bcff" />
            </div>

            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--on-surface)' }}>
                Deployed Soroban Smart Contract
              </h3>
              <p className="data-mono" style={{ fontSize: 13, color: 'var(--primary)', marginTop: 2 }}>
                {shortenAddress(sorobanContractId, 12)}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <GhostButton size="sm" onClick={copyContractAddress} icon={copiedContract ? <Check size={14} color="#44e2cd" /> : <Copy size={14} />}>
              {copiedContract ? 'Address Copied!' : 'Copy Address'}
            </GhostButton>

            <a href={stellarExpertContractLink(sorobanContractId)} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <GhostButton size="sm" icon={<ExternalLink size={14} />}>
                Explorer
              </GhostButton>
            </a>
          </div>
        </div>
      </GlassCard>

      {/* Claim Royalties Modal */}
      <ClaimRoyaltiesModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        trackTitle={trackId.replace(/-/g, ' ')}
      />
    </div>
  );
}

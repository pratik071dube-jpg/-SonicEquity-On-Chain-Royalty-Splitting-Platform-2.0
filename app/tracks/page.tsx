'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Sliders, ArrowRight, Disc } from 'lucide-react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { PrimaryButton, GhostButton } from '@/components/ui/Buttons';
import { StatusChip } from '@/components/ui/StatusChip';
import { LevelMeter } from '@/components/ui/LevelMeter';
import { useWallet } from '@/hooks/useWallet';
import { shortenAddress } from '@/lib/stellar';

const CATALOG_SPLITS = [
  {
    id: 'Midnight-Pulse-EP',
    title: 'Midnight Pulse EP',
    isrc: 'QM-728-23-00102',
    splitContract: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
    status: 'LIVE' as const,
    userEquityPct: 40,
    coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=300&q=80',
    collaborators: [
      { role: 'Lead Artist (Admin)', pct: 40, color: 'violet' as const },
      { role: 'Producer X', pct: 35, color: 'cyan' as const },
      { role: 'Mixing Engineer', pct: 25, color: 'tertiary' as const },
    ],
  },
  {
    id: 'Neon-Horizon-Single',
    title: 'Neon Horizon',
    isrc: 'QM-728-23-00145',
    splitContract: 'CBA9876543210FEDCBA9876543210FEDCBA9876543210FEDCBA98765',
    status: 'LIVE' as const,
    userEquityPct: 50,
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80',
    collaborators: [
      { role: 'Songwriter', pct: 50, color: 'violet' as const },
      { role: 'Beatmaker', pct: 50, color: 'cyan' as const },
    ],
  },
  {
    id: 'Velvet-Echoes',
    title: 'Velvet Echoes',
    isrc: 'QM-728-23-00199',
    splitContract: 'CB9876543210FEDCBA9876543210FEDCBA9876543210FEDCBA987654',
    status: 'LIVE' as const,
    userEquityPct: 35,
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=300&q=80',
    collaborators: [
      { role: 'Producer', pct: 35, color: 'violet' as const },
      { role: 'Guitarist', pct: 35, color: 'cyan' as const },
      { role: 'Vocalist', pct: 30, color: 'tertiary' as const },
    ],
  },
];

export default function TracksCatalogPage() {
  const { isConnected } = useWallet();
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'DRAFTS'>('ALL');

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px 60px' }}>
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span className="data-mono" style={{ fontSize: 12, color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            ON-CHAIN REVENUE GOVERNANCE
          </span>
          <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--on-surface)', marginTop: 4 }}>
            Royalty Splits <span className="gradient-text">Catalog</span>
          </h1>
          <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', marginTop: 2 }}>
            Manage smart contract agreements and Basis-Point shares on Stellar Testnet.
          </p>
        </div>

        <Link href="/tracks/new" style={{ textDecoration: 'none' }}>
          <PrimaryButton size="md" icon={<Plus size={16} />}>
            New Split Contract
          </PrimaryButton>
        </Link>
      </div>

      {/* Catalog Filter Chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
        {(['ALL', 'ACTIVE', 'DRAFTS'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className="data-mono"
            style={{
              padding: '6px 16px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              border: activeFilter === filter ? '1px solid rgba(208,188,255,0.4)' : '1px solid rgba(255,255,255,0.1)',
              background: activeFilter === filter ? 'rgba(208,188,255,0.15)' : 'rgba(23,31,51,0.5)',
              color: activeFilter === filter ? 'var(--primary)' : 'var(--on-surface-variant)',
              cursor: 'pointer',
            }}
          >
            {filter} ({filter === 'ALL' ? CATALOG_SPLITS.length : filter === 'ACTIVE' ? CATALOG_SPLITS.length : 0})
          </button>
        ))}
      </div>

      {/* Catalog Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {CATALOG_SPLITS.map((item) => (
          <GlassCard key={item.id} variant="level2" glow style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 14 }}>
                  <img
                    src={item.coverUrl}
                    alt={item.title}
                    style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--on-surface)' }}>{item.title}</h3>
                    <p className="data-mono" style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginTop: 2 }}>
                      ISRC: {item.isrc}
                    </p>
                  </div>
                </div>

                <StatusChip status={item.status} />
              </div>

              {/* Collaborator breakdown preview */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '20px 0' }}>
                {item.collaborators.map((c, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                    <span style={{ color: 'var(--on-surface-variant)' }}>{c.role}</span>
                    <span className="data-mono" style={{ fontWeight: 700, color: 'var(--secondary)' }}>
                      {c.pct}.00%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <Link href={`/tracks/${item.id}`} style={{ textDecoration: 'none', flex: 1 }}>
                <GhostButton fullWidth size="sm" icon={<ArrowRight size={14} />}>
                  Details & Scrubber
                </GhostButton>
              </Link>

              <Link href="/tracks/new" style={{ textDecoration: 'none', flex: 1 }}>
                <PrimaryButton fullWidth size="sm" icon={<Sliders size={14} />}>
                  Edit Splits
                </PrimaryButton>
              </Link>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

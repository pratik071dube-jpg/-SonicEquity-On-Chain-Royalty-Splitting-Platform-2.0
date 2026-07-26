'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Music2, LayoutDashboard, Sliders, History, Wallet } from 'lucide-react';
import { WalletButton } from '@/components/wallet/WalletButton';

export function Header() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Royalty Splits', path: '/tracks', icon: Sliders },
    { name: 'Payment History', path: '/history', icon: History },
    { name: 'Wallet & Payouts', path: '/payouts', icon: Wallet },
  ];

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(11, 19, 38, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        padding: '0 20px',
      }}
    >
      <div className="container" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 68, padding: 0,
      }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'var(--gradient-brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(160, 120, 255, 0.3)',
          }}>
            <Music2 size={20} color="#060e20" />
          </div>
          <div>
            <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Sonic<span className="gradient-text">Equity</span>
            </span>
            <span style={{ fontSize: 10, fontFamily: 'Geist', display: 'block', color: 'var(--text-muted)', marginTop: -2 }}>
              STELLAR ROYALTY PLATFORM
            </span>
          </div>
        </Link>

        {/* Nav Tabs */}
        <nav className="desktop-nav-only" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                style={{
                  textDecoration: 'none',
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 16px', borderRadius: 8,
                  fontSize: 13, fontWeight: 600,
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  background: isActive ? 'rgba(160, 120, 255, 0.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(160, 120, 255, 0.25)' : '1px solid transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={15} color={isActive ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Wallet Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <WalletButton />
        </div>
      </div>
    </motion.header>
  );
}

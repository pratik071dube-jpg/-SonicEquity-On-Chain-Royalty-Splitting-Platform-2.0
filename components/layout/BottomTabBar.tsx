'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Disc3, PlusCircle, Wallet } from 'lucide-react';

export function BottomTabBar() {
  const pathname = usePathname();

  const tabs = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Projects', path: '/tracks', icon: Disc3 },
    { name: 'Split', path: '/tracks/new', icon: PlusCircle },
    { name: 'Wallet', path: '/payouts', icon: Wallet },
  ];

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 90,
        background: 'rgba(11, 19, 38, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '8px 16px 12px',
        boxShadow: '0 -8px 32px rgba(11, 19, 38, 0.6)',
      }}
    >
      <div
        style={{
          maxWidth: 600,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
        }}
      >
        {tabs.map((tab) => {
          const isActive = pathname === tab.path || (tab.path !== '/' && pathname.startsWith(tab.path));
          const Icon = tab.icon;

          return (
            <Link key={tab.path} href={tab.path} style={{ textDecoration: 'none' }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 16px',
                  borderRadius: 20,
                  background: isActive ? 'rgba(68, 226, 205, 0.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(68, 226, 205, 0.3)' : '1px solid transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                <Icon size={20} color={isActive ? '#44e2cd' : '#cbc3d7'} />
                <span
                  className="data-mono"
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: isActive ? '#44e2cd' : '#cbc3d7',
                  }}
                >
                  {tab.name}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

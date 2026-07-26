import type { Metadata } from 'next';
import './globals.css';
import { WalletProvider } from '@/components/providers/WalletProvider';
import { Header } from '@/components/layout/Header';
import { BottomTabBar } from '@/components/layout/BottomTabBar';

export const metadata: Metadata = {
  title: 'SonicEquity — Transparent Artist Royalties on Stellar',
  description:
    'Register collaborative tracks, define basis-point royalty splits, and disburse incoming XLM payments automatically. Powered by Stellar Soroban smart contracts.',
  keywords: ['sonic equity', 'stellar', 'soroban', 'royalty', 'music', 'blockchain', 'smart contract', 'xlm'],
  openGraph: {
    title: 'SonicEquity',
    description: 'Automated royalty splits enforced on-chain via Stellar Soroban.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <WalletProvider>
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />
            <main style={{ flex: 1, paddingBottom: 80 }}>{children}</main>
            <BottomTabBar />
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}


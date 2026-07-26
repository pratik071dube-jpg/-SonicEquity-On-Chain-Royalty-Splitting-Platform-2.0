'use client';

import { ArrowDownRight, ExternalLink } from 'lucide-react';
import { stellarExpertTxLink } from '@/lib/stellar';

export function PaymentHistory({ trackId, contractAddress }: { trackId: string, contractAddress: string }) {
  // Mock payment history
  const payments = [
    { id: 'tx1234567890abcdef', amount: '125.50', date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
    { id: 'tx2345678901bcdefg', amount: '40.00', date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
    { id: 'tx3456789012cdefgh', amount: '250.75', date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
  ];

  return (
    <div className="glass" style={{ padding: '24px 32px' }}>
      <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24 }}>Recent Payouts</h3>
      
      {payments.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No payments recorded yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {payments.map((p, i) => (
            <div key={i} style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
              padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ 
                  width: 36, height: 36, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}>
                  <ArrowDownRight size={18} color="var(--success)" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--success)' }}>+{p.amount} XLM</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(p.date).toLocaleString()}</div>
                </div>
              </div>
              <a href={stellarExpertTxLink(p.id)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'var(--text-secondary)' }}>
                <button className="btn btn-secondary" style={{ padding: '8px 12px' }}>
                  <ExternalLink size={14} />
                </button>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

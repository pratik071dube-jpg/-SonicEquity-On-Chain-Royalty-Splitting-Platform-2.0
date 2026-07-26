'use client';

import { useState } from 'react';
import { sendXlmPayment, xlmToStroops, stellarExpertTxLink } from '@/lib/stellar';
import { useWallet } from '@/hooks/useWallet';
import { signTransaction } from '@/lib/freighter';
import { X, ExternalLink } from 'lucide-react';
import { ErrorBanner } from '../ui/ErrorBanner';

export function SendPayment({ contractAddress, onClose }: { contractAddress: string; onClose: () => void }) {
  const { publicKey } = useWallet();
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successTx, setSuccessTx] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) return;
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Amount in string for XLM payment
      const tx = await sendXlmPayment(publicKey, contractAddress, amount, (xdr) => signTransaction(xdr, 'TESTNET'));
      setSuccessTx(tx.txHash);
    } catch (err: any) {
      setError(err.userMessage || err.message || 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (successTx) {
    return (
      <div className="glass" style={{ padding: 24, marginBottom: 32, border: '1px solid var(--success)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ color: 'var(--success)', margin: 0 }}>Payment Successful!</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <p style={{ margin: '16px 0', fontSize: 14 }}>Sent {amount} XLM to the contract.</p>
        <a href={stellarExpertTxLink(successTx)} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          View on Stellar Expert <ExternalLink size={14} />
        </a>
      </div>
    );
  }

  return (
    <div className="glass" style={{ padding: 24, marginBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ margin: 0 }}>Send Royalty Payment</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
      </div>
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
      
      <form onSubmit={handleSend} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <input 
            type="number" 
            step="0.1" 
            min="0.1" 
            className="input" 
            placeholder="Amount (XLM)" 
            value={amount} 
            onChange={e => setAmount(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={isLoading || !amount}>
          {isLoading ? 'Sending...' : 'Send XLM'}
        </button>
      </form>
    </div>
  );
}

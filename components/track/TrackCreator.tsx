'use client';

import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { Split, validateSplits, percentageToBps } from '@/lib/contracts';
import { saveTrack } from '@/hooks/useTracks';
import { X, Plus, Trash2 } from 'lucide-react';
import { ErrorBanner } from '../ui/ErrorBanner';

// Mock contract deployment for frontend demo since compiling Soroban takes time.
// In a real app this would deploy a WASM or init an instance.
function generateMockContractId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'C';
  for (let i = 0; i < 55; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
  return id;
}

export function TrackCreator({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const { publicKey } = useWallet();
  const [trackName, setTrackName] = useState('');
  const [splits, setSplits] = useState<{ address: string; pct: string }[]>([
    { address: publicKey || '', pct: '100' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddSplit = () => {
    setSplits([...splits, { address: '', pct: '0' }]);
  };

  const handleRemoveSplit = (index: number) => {
    setSplits(splits.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: 'address' | 'pct', value: string) => {
    const newSplits = [...splits];
    newSplits[index][field] = value;
    setSplits(newSplits);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackName.trim()) {
      setError('Track name is required');
      return;
    }
    
    try {
      const contractSplits: Split[] = splits.map(s => ({
        address: s.address,
        share_bps: percentageToBps(Number(s.pct))
      }));
      
      validateSplits(contractSplits);
      
      setIsLoading(true);
      setError(null);
      
      // Simulate deployment delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const contractId = generateMockContractId();
      
      if (publicKey) {
        saveTrack({
          track_id: trackName,
          split_contract: contractId,
          creator: publicKey,
          created_at: Date.now()
        });
      }
      
      onSuccess();
    } catch (err: any) {
      setError(err.userMessage || err.message || 'Validation failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="glass" style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, margin: 0 }}>Register New Track</h2>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 8, color: 'var(--text-secondary)' }}>Track Name</label>
          <input 
            type="text" 
            className="input" 
            placeholder="e.g. Midnight Synth"
            value={trackName}
            onChange={e => setTrackName(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 500, marginBottom: 8, color: 'var(--text-secondary)' }}>
            <span>Collaborator Splits</span>
            <span>Total: {splits.reduce((sum, s) => sum + (Number(s.pct) || 0), 0)}%</span>
          </label>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {splits.map((split, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <input 
                  type="text" 
                  className="input" 
                  style={{ flex: 1, fontFamily: 'monospace', fontSize: 13 }}
                  placeholder="Stellar Address (G...)" 
                  value={split.address}
                  onChange={e => handleChange(i, 'address', e.target.value)}
                />
                <input 
                  type="number" 
                  className="input" 
                  style={{ width: 100 }}
                  placeholder="%" 
                  min="0" max="100" step="0.01"
                  value={split.pct}
                  onChange={e => handleChange(i, 'pct', e.target.value)}
                />
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ padding: '12px', color: 'var(--error)', borderColor: 'rgba(239,68,68,0.3)' }}
                  onClick={() => handleRemoveSplit(i)}
                  disabled={splits.length === 1}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          
          <button type="button" className="btn btn-secondary" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }} onClick={handleAddSplit}>
            <Plus size={16} /> Add Collaborator
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Deploying...' : 'Deploy Contract'}
          </button>
        </div>
      </form>
    </div>
  );
}

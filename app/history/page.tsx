'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Download, ExternalLink, CheckCircle2, Clock, XCircle, Filter } from 'lucide-react';
import { NetworkGuard } from '@/components/wallet/NetworkGuard';
import { shortenAddress, stellarExpertTxLink, stroopsToXlm } from '@/lib/stellar';
import { MOCK_TRANSACTIONS, TransactionRecord } from '@/lib/data';

export default function HistoryPage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filtered = MOCK_TRANSACTIONS.filter((tx) => {
    const matchesSearch =
      tx.track_id.toLowerCase().includes(search.toLowerCase()) ||
      tx.tx_hash.toLowerCase().includes(search.toLowerCase()) ||
      tx.payer.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || tx.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const exportCSV = () => {
    const headers = ['TxHash', 'TrackID', 'Payer', 'TotalXLM', 'Ledger', 'Date', 'Status'];
    const rows = filtered.map((t) => [
      t.tx_hash,
      t.track_id,
      t.payer,
      stroopsToXlm(t.total_amount),
      t.ledger_sequence,
      t.paid_at,
      t.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `royalty_payouts_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <NetworkGuard>
      <div className="container" style={{ padding: '40px 20px' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}
        >
          <div>
            <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 700, marginBottom: 6 }}>
              Transparent <span className="gradient-text">Payment History</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              Immutable on-chain payment proofs verified on Stellar Testnet.
            </p>
          </div>
          <button className="btn btn-secondary" onClick={exportCSV}>
            <Download size={15} /> Export CSV Proofs
          </button>
        </motion.div>

        {/* Search & Filter Bar */}
        <motion.div
          className="glass-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ padding: 20, marginBottom: 28, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}
        >
          <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              className="input"
              placeholder="Search by Track ID, Tx Hash, or Payer Address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 40 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={15} color="var(--text-muted)" />
            {['all', 'confirmed', 'pending', 'failed'].map((st) => (
              <button
                key={st}
                className={`btn ${filterStatus === st ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterStatus(st)}
                style={{ padding: '6px 14px', fontSize: 12, textTransform: 'capitalize' }}
              >
                {st}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Transactions Table */}
        <motion.div
          className="glass-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ padding: 24, overflowX: 'auto' }}
        >
          <table className="table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Track ID</th>
                <th>Total Distributed</th>
                <th>Payer</th>
                <th>Ledger</th>
                <th>Timestamp</th>
                <th>On-Chain Proof</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx) => (
                <tr key={tx.tx_hash}>
                  <td>
                    {tx.status === 'confirmed' && (
                      <span className="chip chip-verified">
                        <CheckCircle2 size={12} /> Confirmed
                      </span>
                    )}
                    {tx.status === 'pending' && (
                      <span className="chip chip-pending">
                        <Clock size={12} /> Pending
                      </span>
                    )}
                    {tx.status === 'failed' && (
                      <span className="chip chip-error">
                        <XCircle size={12} /> Failed
                      </span>
                    )}
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    {tx.track_id}
                  </td>
                  <td className="data-mono" style={{ fontWeight: 700, color: 'var(--accent-secondary)' }}>
                    {stroopsToXlm(tx.total_amount)} XLM
                  </td>
                  <td className="data-mono" style={{ fontSize: 13 }}>
                    {shortenAddress(tx.payer, 5)}
                  </td>
                  <td className="data-mono" style={{ fontSize: 13 }}>
                    #{tx.ledger_sequence}
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {new Date(tx.paid_at).toLocaleString()}
                  </td>
                  <td>
                    <a
                      href={stellarExpertTxLink(tx.tx_hash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--accent-primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                    >
                      <span className="data-mono">{shortenAddress(tx.tx_hash, 4)}</span>
                      <ExternalLink size={12} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <p>No matching transactions found.</p>
            </div>
          )}
        </motion.div>
      </div>
    </NetworkGuard>
  );
}

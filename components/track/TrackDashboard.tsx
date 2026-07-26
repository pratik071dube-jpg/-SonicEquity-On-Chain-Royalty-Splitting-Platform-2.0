'use client';

import { Track } from '@/hooks/useTracks';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { shortenAddress } from '@/lib/stellar';

export function TrackDashboard({ track }: { track: Track }) {
  // Mock data for the chart, since we can't easily fetch splits back from the mock contract
  const data = [
    { name: 'Producer', address: shortenAddress(track.creator), value: 50 },
    { name: 'Vocalist', address: shortenAddress('GABC1234...'), value: 30 },
    { name: 'Mixer', address: shortenAddress('GDEF5678...'), value: 20 },
  ];

  const COLORS = ['var(--accent-purple)', 'var(--accent-cyan)', 'var(--accent-pink)'];

  return (
    <div className="glass" style={{ padding: '24px 32px' }}>
      <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24 }}>Split Configuration</h3>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40, alignItems: 'center' }}>
        <div style={{ width: 240, height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}
                itemStyle={{ color: 'var(--text-primary)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div style={{ flex: 1, minWidth: 280 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Collaborator</th>
                <th>Share</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                      <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{item.address}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{item.value}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

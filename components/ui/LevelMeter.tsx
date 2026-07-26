'use client';

import React from 'react';

interface LevelMeterProps {
  progress: number; // 0 to 100
  segments?: number;
  height?: number;
  label?: string;
  color?: 'violet' | 'cyan' | 'tertiary';
  animated?: boolean;
}

export function LevelMeter({
  progress,
  segments = 16,
  height = 10,
  label,
  color = 'cyan',
  animated = true,
}: LevelMeterProps) {
  const clamped = Math.max(0, Math.min(100, progress));
  const activeSegments = Math.round((clamped / 100) * segments);

  const getColorGradient = () => {
    switch (color) {
      case 'violet':
        return 'linear-gradient(90deg, #a078ff 0%, #d0bcff 100%)';
      case 'tertiary':
        return 'linear-gradient(90deg, #e364a7 0%, #ffafd3 100%)';
      case 'cyan':
      default:
        return 'linear-gradient(90deg, #03c6b2 0%, #44e2cd 100%)';
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, fontFamily: 'Geist, monospace' }}>
          <span style={{ color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
          <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>{clamped.toFixed(1)}%</span>
        </div>
      )}

      {/* Audio Mixer Segmented Meter */}
      <div
        className="level-meter-bg"
        style={{
          height,
          display: 'flex',
          gap: 2,
          padding: 2,
          background: 'rgba(6, 14, 32, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 6,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {Array.from({ length: segments }).map((_, index) => {
          const isActive = index < activeSegments;
          return (
            <div
              key={index}
              style={{
                flex: 1,
                height: '100%',
                borderRadius: 2,
                background: isActive ? getColorGradient() : 'rgba(255, 255, 255, 0.05)',
                boxShadow: isActive ? `0 0 8px ${color === 'violet' ? 'rgba(160, 120, 255, 0.5)' : 'rgba(68, 226, 205, 0.5)'}` : 'none',
                transition: 'all 0.2s ease',
              }}
            />
          );
        })}

        {/* Shimmer sweep effect overlay */}
        {animated && clamped > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: `${clamped}%`,
              background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.25) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'levelSweep 2s infinite linear',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    </div>
  );
}

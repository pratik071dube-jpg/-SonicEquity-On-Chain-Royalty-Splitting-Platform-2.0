'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Clock, Zap, ShieldCheck, Activity } from 'lucide-react';

export type StatusChipType =
  | 'ESTIMATED'
  | 'ON-CHAIN VERIFIED'
  | 'VALID SPLIT'
  | 'INVALID SPLIT'
  | 'CONFIRMED'
  | 'AUTOMATED'
  | 'LIVE'
  | 'PENDING';

interface StatusChipProps {
  status: StatusChipType | string;
  icon?: boolean;
  size?: 'sm' | 'md';
}

export function StatusChip({ status, icon = true, size = 'sm' }: StatusChipProps) {
  const upperStatus = status.toUpperCase();

  const getChipStyles = () => {
    switch (upperStatus) {
      case 'ON-CHAIN VERIFIED':
      case 'CONFIRMED':
      case 'VALID SPLIT':
        return {
          background: 'rgba(68, 226, 205, 0.15)',
          color: '#44e2cd',
          border: '1px solid rgba(68, 226, 205, 0.35)',
          iconComponent: CheckCircle2,
        };
      case 'LIVE':
      case 'AUTOMATED':
        return {
          background: 'rgba(208, 188, 255, 0.15)',
          color: '#d0bcff',
          border: '1px solid rgba(208, 188, 255, 0.35)',
          iconComponent: Zap,
        };
      case 'ESTIMATED':
      case 'PENDING':
        return {
          background: 'rgba(255, 175, 211, 0.15)',
          color: '#ffafd3',
          border: '1px solid rgba(255, 175, 211, 0.35)',
          iconComponent: Clock,
        };
      case 'INVALID SPLIT':
        return {
          background: 'rgba(255, 180, 171, 0.15)',
          color: '#ffb4ab',
          border: '1px solid rgba(255, 180, 171, 0.35)',
          iconComponent: AlertCircle,
        };
      default:
        return {
          background: 'rgba(208, 188, 255, 0.12)',
          color: '#d0bcff',
          border: '1px solid rgba(208, 188, 255, 0.3)',
          iconComponent: ShieldCheck,
        };
    }
  };

  const styleConfig = getChipStyles();
  const IconComp = styleConfig.iconComponent;
  const isSm = size === 'sm';

  return (
    <span
      className="data-mono"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: isSm ? '3px 9px' : '5px 12px',
        borderRadius: 9999,
        fontSize: isSm ? 10 : 12,
        fontWeight: 600,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        background: styleConfig.background,
        color: styleConfig.color,
        border: styleConfig.border,
        boxShadow: `0 0 12px ${styleConfig.color}22`,
        lineHeight: 1,
      }}
    >
      {icon && <IconComp size={isSm ? 11 : 13} />}
      {upperStatus}
    </span>
  );
}

'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  variant?: 'level1' | 'level2' | 'level3';
  glow?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function GlassCard({
  children,
  variant = 'level2',
  glow = false,
  className = '',
  style = {},
  ...props
}: GlassCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'level1':
        return {
          background: 'rgba(11, 19, 38, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        };
      case 'level3':
        return {
          background: 'rgba(29, 36, 57, 0.85)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          border: '1px solid rgba(208, 188, 255, 0.2)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 25px rgba(208, 188, 255, 0.1)',
        };
      case 'level2':
      default:
        return {
          background: 'rgba(23, 31, 51, 0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: glow ? '0 8px 32px rgba(139, 92, 246, 0.2)' : '0 8px 24px rgba(6, 14, 32, 0.4)',
        };
    }
  };

  return (
    <motion.div
      className={`glass-panel ${className}`}
      style={{
        borderRadius: 16,
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
        ...getVariantStyles(),
        ...style,
      }}
      whileHover={glow ? { scale: 1.01, borderColor: 'rgba(208, 188, 255, 0.35)' } : undefined}
      {...props}
    >
      {/* Top subtle highlight border line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.02) 100%)',
          pointerEvents: 'none',
        }}
      />
      {children}
    </motion.div>
  );
}

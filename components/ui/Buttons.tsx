'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface PrimaryButtonProps extends HTMLMotionProps<'button'> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function PrimaryButton({
  children,
  icon,
  fullWidth = false,
  size = 'md',
  disabled,
  style = {},
  ...props
}: PrimaryButtonProps) {
  const paddingMap = {
    sm: '8px 16px',
    md: '12px 24px',
    lg: '16px 32px',
  };

  const fontSizeMap = {
    sm: 13,
    md: 14,
    lg: 16,
  };

  return (
    <motion.button
      className="btn-primary"
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      disabled={disabled}
      style={{
        width: fullWidth ? '100%' : 'auto',
        padding: paddingMap[size],
        fontSize: fontSizeMap[size],
        ...style,
      }}
      {...props}
    >
      {icon && <span style={{ display: 'inline-flex' }}>{icon}</span>}
      {children}
    </motion.button>
  );
}

export function GhostButton({
  children,
  icon,
  fullWidth = false,
  size = 'md',
  disabled,
  style = {},
  ...props
}: PrimaryButtonProps) {
  const paddingMap = {
    sm: '8px 16px',
    md: '12px 24px',
    lg: '16px 32px',
  };

  const fontSizeMap = {
    sm: 13,
    md: 14,
    lg: 16,
  };

  return (
    <motion.button
      className="btn-ghost"
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      disabled={disabled}
      style={{
        width: fullWidth ? '100%' : 'auto',
        padding: paddingMap[size],
        fontSize: fontSizeMap[size],
        ...style,
      }}
      {...props}
    >
      {icon && <span style={{ display: 'inline-flex' }}>{icon}</span>}
      {children}
    </motion.button>
  );
}

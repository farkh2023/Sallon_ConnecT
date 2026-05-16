'use client';

import React from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
type Size    = 'xs' | 'sm' | 'md';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?:    Size;
  loading?: boolean;
}

const V: Record<Variant, string> = {
  primary:   'bg-brand text-white hover:bg-blue-700 border border-brand',
  secondary: 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10',
  danger:    'bg-danger/10 text-red-400 hover:bg-danger/20 border border-danger/20',
  success:   'bg-success/10 text-emerald-400 hover:bg-success/20 border border-success/20',
  ghost:     'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent',
};
const S: Record<Size, string> = {
  xs: 'px-2.5 py-1 text-xs',
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
};

export function Button({ variant = 'secondary', size = 'sm', loading, disabled, children, className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${V[variant]} ${S[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="animate-spin inline-block">⟳</span>}
      {children}
    </button>
  );
}

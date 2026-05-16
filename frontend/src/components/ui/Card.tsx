import React from 'react';

interface CardProps {
  children:  React.ReactNode;
  className?: string;
  title?:     string;
}

export function Card({ children, className = '', title }: CardProps) {
  return (
    <div className={`bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 ${className}`}>
      {title && <h3 className="text-sm font-semibold text-slate-300 mb-3">{title}</h3>}
      {children}
    </div>
  );
}

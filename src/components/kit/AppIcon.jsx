import React from 'react';
import { cn } from '@/lib/utils';

const SIZES = { sm: 'h-6 w-6 text-[10px]', md: 'h-8 w-8 text-[11px]', lg: 'h-11 w-11 text-sm' };

export default function AppIcon({ app, size = 'md', className }) {
  const initials = (app?.name || '?').split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-md font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]', SIZES[size], className)}
      style={{ background: app?.icon_color || '#1F2937' }}
    >
      {initials}
    </span>
  );
}
import React from 'react';
import { cn } from '@/lib/utils';

export default function MetricCard({ label, value, hint, icon: Icon, accent, loading }) {
  return (
    <div className="surface group p-4 transition-shadow duration-300 hover:shadow-[0_6px_20px_-10px_rgba(16,24,40,0.18)]">
      <div className="flex items-center justify-between">
        <span className="label-caps">{label}</span>
        {Icon && <Icon className={cn('h-3.5 w-3.5 text-muted-foreground/70 transition-colors group-hover:text-brand', accent)} />}
      </div>
      {loading ? (
        <div className="mt-3 h-6 w-20 animate-pulse rounded bg-muted" />
      ) : (
        <div className="mt-2 text-[22px] font-semibold leading-none tracking-tight tabular-nums">{value}</div>
      )}
      {hint && <div className="mt-2 truncate text-[11.5px] text-muted-foreground">{hint}</div>}
    </div>
  );
}
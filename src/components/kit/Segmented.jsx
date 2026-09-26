import React from 'react';
import { cn } from '@/lib/utils';

export default function Segmented({ value, onChange, options, className }) {
  return (
    <div className={cn('inline-flex rounded-md border bg-card p-0.5', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          title={o.title}
          className={cn(
            'inline-flex h-7 items-center gap-1 rounded-[5px] px-2.5 text-[11.5px] font-medium transition-all duration-200',
            value === o.value ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {o.icon && <o.icon className="h-3.5 w-3.5" />}
          {o.label}
        </button>
      ))}
    </div>
  );
}
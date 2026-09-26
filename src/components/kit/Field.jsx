import React from 'react';
import { cn } from '@/lib/utils';

export default function Field({ label, hint, error, children, className, required }) {
  return (
    <div className={cn('block space-y-1.5', className)}>
      <span className="text-[12px] font-medium text-foreground/85">
        {label}
        {required && <span className="ml-0.5 text-brand">*</span>}
      </span>
      {children}
      {error ? <span className="block text-[11.5px] text-rose-600">{error}</span> : hint && <span className="block text-[11.5px] text-muted-foreground">{hint}</span>}
    </div>
  );
}
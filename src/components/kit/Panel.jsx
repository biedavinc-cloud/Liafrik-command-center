import React from 'react';
import { cn } from '@/lib/utils';

export default function Panel({ title, subtitle, actions, children, className, bodyClassName }) {
  return (
    <section className={cn('surface flex flex-col', className)}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-3 border-b px-4 py-3">
          <div className="min-w-0">
            {title && <h2 className="text-[13px] font-semibold">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-[11.5px] text-muted-foreground">{subtitle}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
        </header>
      )}
      <div className={cn('flex-1 p-4', bodyClassName)}>{children}</div>
    </section>
  );
}
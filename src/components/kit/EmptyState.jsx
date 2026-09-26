import React from 'react';
import { Inbox, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EmptyState({ icon: Icon = Inbox, title, description, action, tone, className }) {
  const error = tone === 'error';
  const I = error ? AlertTriangle : Icon;
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      <div className={cn('mb-3 flex h-10 w-10 items-center justify-center rounded-full border', error ? 'border-rose-200 bg-rose-50 text-rose-600' : 'bg-muted text-muted-foreground')}>
        <I className="h-4 w-4" />
      </div>
      <h3 className="text-[13.5px] font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-md text-[12.5px] leading-relaxed text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
import React from 'react';
import { Mail, Send, MessageSquare, Send as Telegram, Phone, Slack, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICONS = { mail: Mail, send: Send, slack: Slack, telegram: Telegram, whatsapp: Phone, gmail: Mail };

export default function ChannelCards({ channels, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="surface flex h-32 items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {channels.map((ch) => {
        const Icon = ICONS[ch.icon] || MessageSquare;
        return (
          <div key={ch.key} className={cn('surface flex flex-col p-3.5 transition-shadow hover:shadow-md', !ch.configured && 'opacity-75')}>
            <div className="mb-2 flex items-center justify-between">
              <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', ch.configured ? 'bg-brand-soft text-brand' : 'bg-muted text-muted-foreground')}>
                <Icon className="h-4 w-4" />
              </div>
              {ch.configured ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              )}
            </div>
            <div className="text-[12px] font-semibold">{ch.name}</div>
            <div className="mt-0.5 text-[10px] leading-tight text-muted-foreground line-clamp-2">{ch.description}</div>
            <div className={cn('mt-2 rounded px-1.5 py-0.5 text-center text-[9px] font-medium uppercase tracking-wide', ch.configured ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>
              {ch.configured ? 'Ready' : 'Needs Config'}
            </div>
          </div>
        );
      })}
    </div>
  );
}
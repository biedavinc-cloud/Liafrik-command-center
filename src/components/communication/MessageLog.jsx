import React from 'react';
import { useOutboundMessages } from '@/lib/data/hooks';
import Panel from '@/components/kit/Panel';
import EmptyState from '@/components/kit/EmptyState';
import ChannelLogo from './ChannelLogos';
import { CheckCircle2, XCircle, Clock, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_ICONS = { sent: CheckCircle2, failed: XCircle, pending: Clock };
const STATUS_COLORS = { sent: 'text-emerald-600', failed: 'text-rose-600', pending: 'text-amber-600' };

export default function MessageLog() {
  const { data: messages = [], isLoading } = useOutboundMessages();

  return (
    <Panel title="Recent Outbound Messages" subtitle="Audit trail of all client communications">
      {isLoading ? (
        <div className="flex justify-center py-8"><div className="h-5 w-5 border-2 border-muted border-t-brand rounded-full animate-spin" /></div>
      ) : messages.length === 0 ? (
        <EmptyState title="No messages sent yet" description="Your outbound communications will appear here" icon={MessageSquare} />
      ) : (
        <div className="divide-y">
          {messages.slice(0, 20).map((msg) => {
            const StatusIcon = STATUS_ICONS[msg.status] || Clock;
            return (
              <div key={msg.id} className="flex items-start gap-3 py-3">
                <ChannelLogo channel={msg.channel} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-medium truncate">{msg.recipient}</span>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-medium uppercase text-muted-foreground">{msg.channel}</span>
                    {msg.application_name && <span className="text-[10px] text-muted-foreground">· {msg.application_name}</span>}
                  </div>
                  {msg.subject && <div className="text-[11px] font-medium text-foreground/80 truncate">{msg.subject}</div>}
                  <div className="text-[11px] text-muted-foreground truncate">{msg.body}</div>
                  {msg.status === 'failed' && msg.error && <div className="text-[10px] text-rose-600 truncate">⚠ {msg.error}</div>}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <StatusIcon className={cn('h-3.5 w-3.5', STATUS_COLORS[msg.status])} />
                  <span className="text-[9.5px] text-muted-foreground">{new Date(msg.created_date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
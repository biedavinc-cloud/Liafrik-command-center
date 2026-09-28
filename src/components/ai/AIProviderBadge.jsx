import { invokeFunction } from '@/lib/api';
import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2, Cpu } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useT } from '@/lib/i18n/I18nProvider';
import { cn } from '@/lib/utils';

export default function AIProviderBadge() {
  const { t } = useT();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invokeFunction('aiStatus', {})
      .then((r) => setStatus(r.data))
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-[12px]">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        <span className="text-muted-foreground">Checking AI provider…</span>
      </div>
    );
  }

  const connected = status?.configured;
  return (
    <div className={cn(
      'flex items-center gap-2 rounded-md border px-3 py-2 text-[12px]',
      connected ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700',
    )}>
      {connected ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
      <span className="font-medium">{connected ? t('ai.providerConnected') : t('ai.providerNotConnected')}</span>
      {connected && (
        <span className="flex items-center gap-1 text-muted-foreground">
          <Cpu className="h-3 w-3" />
          {status.model}
        </span>
      )}
    </div>
  );
}
import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, Loader2, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n/I18nProvider';
import ChannelLogo from './ChannelLogos';
import ChannelConfigDialog from './ChannelConfigDialog';

export default function ChannelCards({ channels, isLoading }) {
  const { t } = useT();
  const [configChannel, setConfigChannel] = useState(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: 11 }).map((_, i) => (
          <div key={i} className="surface flex h-40 items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {channels.map((ch) => (
          <div key={ch.key} className={cn('surface flex flex-col p-3.5 transition-shadow hover:shadow-md', !ch.configured && 'opacity-80')}>
            <div className="mb-2.5 flex items-start justify-between">
              <ChannelLogo channel={ch.key} size="md" />
              {ch.configured ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
              )}
            </div>
            <div className="text-[12px] font-semibold leading-tight">{ch.name}</div>
            <div className="mt-0.5 text-[10px] leading-tight text-muted-foreground line-clamp-2">{ch.description}</div>
            <div className="mt-auto flex items-center gap-1.5 pt-2.5">
              <div className={cn('rounded px-1.5 py-0.5 text-center text-[9px] font-medium uppercase tracking-wide', ch.configured ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>
                {ch.configured ? t('communication.ready') : t('communication.needsConfig')}
              </div>
              {ch.composable === false && (
                <span className="rounded bg-muted px-1.5 py-0.5 text-[8.5px] font-medium uppercase tracking-wide text-muted-foreground">{t('communication.auto')}</span>
              )}
              <button
                onClick={() => setConfigChannel(ch.key)}
                className="ml-auto flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                title={t('communication.configure')}
              >
                <Settings className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <ChannelConfigDialog channel={configChannel} open={!!configChannel} onOpenChange={(v) => !v && setConfigChannel(null)} />
    </>
  );
}
import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useT } from '@/lib/i18n/I18nProvider';
import StatusBadge, { StatusDot } from '@/components/kit/StatusBadge';

export default function EnvironmentCard({ env }) {
  const { t, fmt } = useT();
  return (
    <div className="surface p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px] font-semibold"><StatusDot value={env.status} pulse />{t(`env.${env.name}`)}</div>
        <StatusBadge value={env.status} />
      </div>
      {env.url && (
        <a href={env.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-[11.5px] text-muted-foreground hover:text-foreground">
          {env.url.replace(/^https?:\/\//, '')}<ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      )}
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t pt-3 text-[11.5px]">
        <div><dt className="text-muted-foreground">{t('apps.version')}</dt><dd className="font-medium">{env.version || '—'}</dd></div>
        <div><dt className="text-muted-foreground">{t('apps.health')}</dt><dd className="font-medium tabular-nums">{fmt.percent(env.health, 2)}</dd></div>
        <div><dt className="text-muted-foreground">{t('apps.deployment')}</dt><dd className="font-medium">{fmt.ago(env.last_deployment)}</dd></div>
        <div><dt className="text-muted-foreground">{t('monitoring.api')}</dt><dd><StatusBadge value={env.api_status} /></dd></div>
      </dl>
    </div>
  );
}
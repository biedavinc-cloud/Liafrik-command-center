import { invokeFunction } from '@/lib/api';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScrollText, Loader2 } from 'lucide-react';
import { useT } from '@/lib/i18n/I18nProvider';
import EmptyState from '@/components/kit/EmptyState';

const TYPE_LABELS = {
  query: 'Query', analyze: 'AIOps', incident: 'Incident', security: 'Security', onboard: 'Onboard', search: 'Search',
};

export default function AIGovernanceLog() {
  const { t, fmt } = useT();
  const { data: activities, isLoading } = useQuery({
    queryKey: ['aiActivities'],
    queryFn: () => invokeFunction('neonData', {
      entity: 'AiActivity', operation: 'list', sort: '-created_date', limit: 100,
    }).then((r) => r.data),
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!activities?.length) {
    return <EmptyState icon={ScrollText} title={t('ai.governanceEmpty')} description={t('ai.governance')} />;
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead className="border-b bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-medium">{t('ai.timestamp')}</th>
              <th className="px-3 py-2 text-left font-medium">{t('ai.user')}</th>
              <th className="px-3 py-2 text-left font-medium">{t('ai.requestType')}</th>
              <th className="px-3 py-2 text-left font-medium">{t('ai.prompt')}</th>
              <th className="px-3 py-2 text-left font-medium">{t('ai.provider')}</th>
              <th className="px-3 py-2 text-right font-medium">{t('ai.tokensUsed')}</th>
              <th className="px-3 py-2 text-right font-medium">{t('ai.latency')}</th>
              <th className="px-3 py-2 text-left font-medium">{t('ai.error')}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {activities.map((a) => (
              <tr key={a.id} className="hover:bg-muted/30">
                <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{fmt.dateTime(a.created_date)}</td>
                <td className="whitespace-nowrap px-3 py-2">{a.user_email || '—'}</td>
                <td className="px-3 py-2">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium">{TYPE_LABELS[a.request_type] || a.request_type}</span>
                </td>
                <td className="max-w-[280px] truncate px-3 py-2" title={a.prompt}>{a.prompt}</td>
                <td className="whitespace-nowrap px-3 py-2">{a.provider || '—'}</td>
                <td className="px-3 py-2 text-right tabular-nums">{a.tokens_used || 0}</td>
                <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{a.latency_ms ? `${Math.round(a.latency_ms)}ms` : '—'}</td>
                <td className="max-w-[200px] truncate px-3 py-2 text-rose-600" title={a.error || ''}>{a.error || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
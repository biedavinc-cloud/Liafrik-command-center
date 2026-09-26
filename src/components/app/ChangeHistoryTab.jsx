import React from 'react';
import { History } from 'lucide-react';
import { useT } from '@/lib/i18n/I18nProvider';
import { useChangeRecords } from '@/lib/data/hooks';
import Panel from '@/components/kit/Panel';
import EmptyState from '@/components/kit/EmptyState';

export default function ChangeHistoryTab({ app }) {
  const { t, fmt } = useT();
  const { data: changes = [], isLoading } = useChangeRecords(app.id);

  return (
    <Panel title={t('changeHistory.title')} subtitle={t('changeHistory.subtitle')}>
      {isLoading ? <div className="py-8 text-center text-[12.5px] text-muted-foreground">Loading…</div> :
       changes.length === 0 ? <EmptyState icon={History} title={t('changeHistory.empty')} description={t('changeHistory.emptyBody')} /> : (
        <div className="space-y-2">
          {changes.map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-md border px-3 py-2.5 text-[12.5px]">
              <History className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <span className="font-medium">{c.field}</span>
                <span className="mx-2 text-muted-foreground">→</span>
                <span className="line-through text-muted-foreground">{c.before || '∅'}</span>
                <span className="mx-2 text-muted-foreground">→</span>
                <span className="font-medium text-brand">{c.after || '∅'}</span>
              </div>
              <span className="shrink-0 text-[11px] text-muted-foreground">{c.changed_by}</span>
              <span className="shrink-0 text-[11px] text-muted-foreground">{fmt.dateTime(c.created_date)}</span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
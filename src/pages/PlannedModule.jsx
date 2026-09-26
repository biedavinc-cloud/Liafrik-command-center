import React from 'react';
import { Check, Hourglass } from 'lucide-react';
import { useT } from '@/lib/i18n/I18nProvider';
import PageHeader from '@/components/kit/PageHeader';

export default function PlannedModule({ moduleKey }) {
  const { t } = useT();
  const features = t(`planned.${moduleKey}`);
  return (
    <div>
      <PageHeader title={t(`nav.${moduleKey}`)} subtitle={t('planned.subtitle')} breadcrumbs={[{ label: t(`nav.${moduleKey}`) }]} />
      <div className="surface mx-auto max-w-2xl p-8 text-center">
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full border bg-brand-soft text-brand"><Hourglass className="h-5 w-5" /></div>
        <h2 className="text-[15px] font-semibold">{t('planned.title')}</h2>
        <p className="mx-auto mt-1.5 max-w-md text-[12.5px] text-muted-foreground">{t('planned.body')}</p>
        {Array.isArray(features) && (
          <ul className="mx-auto mt-6 grid max-w-md gap-2 text-left">
            {features.map((f) => <li key={f} className="flex items-center gap-2.5 rounded-md border px-3 py-2 text-[12.5px]"><Check className="h-3.5 w-3.5 text-brand" />{f}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
}
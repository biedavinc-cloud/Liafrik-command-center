import React from 'react';
import { FlaskConical } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useT } from '@/lib/i18n/I18nProvider';

export default function DemoBadge() {
  const { t } = useT();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 rounded border border-dashed border-brand/50 bg-brand-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-brand">
          <FlaskConical className="h-3 w-3" />
          {t('common.demo')}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs">{t('common.demoHint')}</TooltipContent>
    </Tooltip>
  );
}
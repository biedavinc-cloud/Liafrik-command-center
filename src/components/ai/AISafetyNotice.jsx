import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useT } from '@/lib/i18n/I18nProvider';

export default function AISafetyNotice() {
  const { t } = useT();
  return (
    <div className="flex items-start gap-2.5 rounded-md border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12px] text-amber-800">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="leading-relaxed">{t('ai.safetyNotice')}</p>
    </div>
  );
}
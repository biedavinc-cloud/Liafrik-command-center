import React from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { useSystemState } from '@/lib/data/hooks';
import { useT } from '@/lib/i18n/I18nProvider';

export default function SafeModeBanner() {
  const { t } = useT();
  const { data: states = [] } = useSystemState();
  const state = states[0];

  if (!state?.safe_mode_enabled) return null;

  return (
    <div className="border-b border-amber-300/60 bg-amber-50 px-4 py-2.5 dark:border-amber-700/40 dark:bg-amber-950/30">
      <div className="mx-auto flex w-full max-w-[1560px] items-center gap-2.5">
        <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="flex-1 text-[12.5px]">
          <span className="font-semibold text-amber-800 dark:text-amber-200">{t('safeMode.active')}</span>
          {state.safe_mode_reason && (
            <span className="ml-2 text-amber-700 dark:text-amber-300/80">{state.safe_mode_reason}</span>
          )}
        </div>
        <span className="hidden text-[11px] text-amber-600 dark:text-amber-400/70 sm:inline">
          {t('safeMode.readOnly')}
        </span>
      </div>
    </div>
  );
}
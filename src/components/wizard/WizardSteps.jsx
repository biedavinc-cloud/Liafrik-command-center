import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n/I18nProvider';
import { WIZARD_STEPS } from './validate';

export default function WizardSteps({ current, onJump }) {
  const { t } = useT();
  return (
    <>
      <div className="mb-4 lg:hidden">
        <div className="flex items-center justify-between text-[11.5px]">
          <span className="font-medium">{t(`wizard.steps.${WIZARD_STEPS[current]}`)}</span>
          <span className="text-muted-foreground">{t('wizard.stepOf', { n: current + 1, total: WIZARD_STEPS.length })}</span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted"><div className="h-full bg-brand transition-all duration-500" style={{ width: `${((current + 1) / WIZARD_STEPS.length) * 100}%` }} /></div>
      </div>
      <ol className="hidden space-y-1 lg:block">
        {WIZARD_STEPS.map((s, i) => {
          const done = i < current;
          return (
            <li key={s}>
              <button disabled={i > current} onClick={() => onJump(i)} className={cn('flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors', i === current ? 'bg-card shadow-sm ring-1 ring-border' : 'hover:bg-muted/60 disabled:hover:bg-transparent')}>
                <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors', done ? 'border-brand bg-brand text-white' : i === current ? 'border-foreground text-foreground' : 'text-muted-foreground')}>
                  {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className="min-w-0">
                  <span className={cn('block text-[12.5px] font-medium', i > current && 'text-muted-foreground')}>{t(`wizard.steps.${s}`)}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{t(`wizard.stepsHint.${s}`)}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </>
  );
}
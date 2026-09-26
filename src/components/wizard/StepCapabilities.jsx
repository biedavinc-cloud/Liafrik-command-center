import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n/I18nProvider';
import { CAPABILITIES } from '@/lib/protocol/capabilities';

export default function StepCapabilities({ form, set, errors }) {
  const { t } = useT();
  const toggle = (k) => set('capabilities', form.capabilities.includes(k) ? form.capabilities.filter((c) => c !== k) : [...form.capabilities, k]);
  return (
    <div>
      <p className="mb-4 text-[12.5px] text-muted-foreground">{t('wizard.capIntro')}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {CAPABILITIES.map((c) => {
          const on = form.capabilities.includes(c.key);
          return (
            <button key={c.key} type="button" onClick={() => toggle(c.key)} className={cn('flex items-center gap-2.5 rounded-md border px-3 py-2.5 text-left text-[12.5px] transition-all duration-150', on ? 'border-brand bg-brand-soft text-foreground' : 'bg-card hover:border-foreground/20')}>
              <c.icon className={cn('h-4 w-4 shrink-0', on ? 'text-brand' : 'text-muted-foreground')} />
              <span className="flex-1 truncate font-medium">{t(`cap.${c.key}`)}</span>
              <span className={cn('flex h-4 w-4 items-center justify-center rounded-sm border transition-colors', on ? 'border-brand bg-brand text-white' : '')}>{on && <Check className="h-3 w-3" />}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between text-[11.5px]">
        <span className="text-rose-600">{errors.capabilities && t(`wizard.errors.${errors.capabilities}`)}</span>
        <span className="text-muted-foreground">{t('wizard.capCount', { n: form.capabilities.length })}</span>
      </div>
    </div>
  );
}
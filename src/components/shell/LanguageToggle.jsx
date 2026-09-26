import React from 'react';
import { cn } from '@/lib/utils';
import { useT, LANGUAGES } from '@/lib/i18n/I18nProvider';

export default function LanguageToggle() {
  const { lang, setLang, t } = useT();
  return (
    <div className="inline-flex h-8 items-center rounded-md border bg-card p-0.5" role="group" aria-label={t('header.language')}>
      {LANGUAGES.map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={cn('h-full rounded-[4px] px-2 text-[10.5px] font-semibold tracking-wider transition-all', lang === l ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
import React from 'react';
import { CalendarRange } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n/I18nProvider';
import Segmented from './Segmented';

const RANGES = ['today', '7d', '30d', '90d', '12m'];

export default function TimeRangeFilter({ value, onChange, custom, onCustom }) {
  const { t } = useT();
  return (
    <div className="flex items-center gap-1.5">
      <Segmented value={value} onChange={onChange} options={RANGES.map((r) => ({ value: r, label: t(`range.${r}`) }))} className="overflow-x-auto scrollbar-none" />
      <Popover>
        <PopoverTrigger asChild>
          <button className={cn('inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[11.5px] font-medium transition-colors', value === 'custom' ? 'border-primary bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground')}>
            <CalendarRange className="h-3.5 w-3.5" />{t('range.custom')}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 space-y-2.5 p-3">
          <div className="label-caps">{t('range.customTitle')}</div>
          <Input type="date" value={custom.from} onChange={(e) => { onCustom({ ...custom, from: e.target.value }); onChange('custom'); }} className="h-8 text-[12px]" />
          <Input type="date" value={custom.to} onChange={(e) => { onCustom({ ...custom, to: e.target.value }); onChange('custom'); }} className="h-8 text-[12px]" />
        </PopoverContent>
      </Popover>
    </div>
  );
}
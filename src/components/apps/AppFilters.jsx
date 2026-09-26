import React from 'react';
import { Search, LayoutGrid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useT } from '@/lib/i18n/I18nProvider';
import { APP_TYPES, ENVIRONMENTS } from '@/lib/protocol/capabilities';
import { HEALTH_STATUSES } from '@/lib/status';
import Segmented from '@/components/kit/Segmented';

function FilterSelect({ value, onChange, options, allLabel, labelOf }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-full text-[12px] sm:w-[150px]"><SelectValue /></SelectTrigger>
      <SelectContent>
        {allLabel && <SelectItem value="all" className="text-[12.5px]">{allLabel}</SelectItem>}
        {options.map((o) => <SelectItem key={o} value={o} className="text-[12.5px]">{labelOf(o)}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export default function AppFilters({ f, setF, view, setView }) {
  const { t } = useT();
  const up = (k) => (v) => setF({ ...f, [k]: v });
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input value={f.q} onChange={(e) => up('q')(e.target.value)} placeholder={t('apps.searchPlaceholder')} className="h-8 pl-8 text-[12.5px]" />
      </div>
      <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
        <FilterSelect value={f.status} onChange={up('status')} options={HEALTH_STATUSES} allLabel={t('filters.allStatuses')} labelOf={(o) => t(`status.${o}`)} />
        <FilterSelect value={f.env} onChange={up('env')} options={ENVIRONMENTS} allLabel={t('filters.allEnvironments')} labelOf={(o) => t(`env.${o}`)} />
        <FilterSelect value={f.type} onChange={up('type')} options={APP_TYPES} allLabel={t('filters.allTypes')} labelOf={(o) => t(`appType.${o}`)} />
        <FilterSelect value={f.lifecycle} onChange={up('lifecycle')} options={['active', 'disabled', 'archived']} allLabel={t('filters.allLifecycles')} labelOf={(o) => t(`status.${o}`)} />
        <FilterSelect value={f.sort} onChange={up('sort')} options={['name', 'users', 'health', 'heartbeat']} labelOf={(o) => t(`sort.${o}`)} />
      </div>
      <Segmented className="ml-auto" value={view} onChange={setView} options={[{ value: 'grid', icon: LayoutGrid, title: t('apps.grid') }, { value: 'list', icon: List, title: t('apps.list') }]} />
    </div>
  );
}
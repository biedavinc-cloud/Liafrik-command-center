import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/I18nProvider';

export default function TablePagination({ page, pageSize, total, onPage }) {
  const { t } = useT();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total ? page * pageSize + 1 : 0;
  const to = Math.min(total, (page + 1) * pageSize);
  return (
    <div className="flex items-center justify-between border-t px-3 py-2 text-[11.5px] text-muted-foreground">
      <span>{t('table.range', { from, to, total })}</span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === 0} onClick={() => onPage(page - 1)}><ChevronLeft className="h-3.5 w-3.5" /></Button>
        <span className="px-1 tabular-nums">{page + 1} / {pages}</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= pages - 1} onClick={() => onPage(page + 1)}><ChevronRight className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}
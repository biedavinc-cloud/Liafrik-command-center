import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpDown, Download, Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n/I18nProvider';
import { exportCsv } from '@/lib/exportCsv';
import EmptyState from './EmptyState';
import TablePagination from './TablePagination';

export default function DataTable({ columns, rows = [], searchKeys = [], pageSize = 10, selectable, bulkActions, exportName, onRowClick, toolbar, loading, error, empty, initialQuery = '' }) {
  const { t } = useT();
  const [q, setQ] = useState(initialQuery);
  const [sort, setSort] = useState(null);
  const [page, setPage] = useState(0);
  const [sel, setSel] = useState([]);
  const [hidden, setHidden] = useState([]);
  const cols = columns.filter((c) => !hidden.includes(c.key));

  const filtered = useMemo(() => {
    let r = rows;
    if (q) r = r.filter((row) => searchKeys.some((k) => String(row[k] ?? '').toLowerCase().includes(q.toLowerCase())));
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      const val = col?.sortValue || ((x) => x[sort.key]);
      r = [...r].sort((a, b) => { const x = val(a) ?? '', y = val(b) ?? ''; return (x > y ? 1 : x < y ? -1 : 0) * (sort.dir === 'asc' ? 1 : -1); });
    }
    return r;
  }, [rows, q, sort, columns, searchKeys]);

  useEffect(() => setPage(0), [q, rows.length]);
  const pageRows = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const allOnPage = pageRows.length > 0 && pageRows.every((r) => sel.includes(r.id));
  const toggleAll = () => setSel(allOnPage ? sel.filter((id) => !pageRows.some((r) => r.id === id)) : [...new Set([...sel, ...pageRows.map((r) => r.id)])]);
  const toggle = (id) => setSel(sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]);
  const toggleSort = (key) => setSort(sort?.key === key ? (sort.dir === 'asc' ? { key, dir: 'desc' } : null) : { key, dir: 'asc' });

  return (
    <div className="surface overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2.5">
        {searchKeys.length > 0 && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('table.search')} className="h-8 pl-8 text-[12.5px]" />
          </div>
        )}
        {toolbar}
        <div className="ml-auto flex items-center gap-1.5">
          {selectable && sel.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-md bg-brand-soft px-2 py-1 text-[11.5px] font-medium text-brand">
              {t('table.selected', { n: sel.length })}
              {bulkActions?.(rows.filter((r) => sel.includes(r.id)), () => setSel([]))}
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="hidden h-8 gap-1.5 text-[12px] md:inline-flex"><SlidersHorizontal className="h-3.5 w-3.5" />{t('table.columns')}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-[11px]">{t('table.columns')}</DropdownMenuLabel>
              {columns.filter((c) => c.header).map((c) => (
                <DropdownMenuCheckboxItem key={c.key} className="text-[12.5px]" checked={!hidden.includes(c.key)} onCheckedChange={() => setHidden(hidden.includes(c.key) ? hidden.filter((h) => h !== c.key) : [...hidden, c.key])}>{c.header}</DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {exportName && (
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-[12px]" onClick={() => exportCsv(exportName, cols.filter((c) => c.header), filtered)}>
              <Download className="h-3.5 w-3.5" />{t('table.export')}
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
      ) : error ? (
        <EmptyState tone="error" title={t('states.errorTitle')} description={t('states.errorBody')} />
      ) : filtered.length === 0 ? (
        <EmptyState title={empty?.title || t('table.empty')} description={empty?.description} action={empty?.action} />
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  {selectable && <th className="w-10 px-3 py-2"><Checkbox checked={allOnPage} onCheckedChange={toggleAll} /></th>}
                  {cols.map((c) => (
                    <th key={c.key} className={cn('whitespace-nowrap px-3 py-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground', c.className)}>
                      {c.sortable ? (
                        <button onClick={() => toggleSort(c.key)} className="inline-flex items-center gap-1 hover:text-foreground">{c.header}<ArrowUpDown className={cn('h-3 w-3', sort?.key === c.key ? 'text-brand' : 'opacity-40')} /></button>
                      ) : c.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => (
                  <tr key={row.id} onClick={() => onRowClick?.(row)} className={cn('border-b last:border-0 transition-colors hover:bg-muted/40', onRowClick && 'cursor-pointer', sel.includes(row.id) && 'bg-brand-soft/60')}>
                    {selectable && <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}><Checkbox checked={sel.includes(row.id)} onCheckedChange={() => toggle(row.id)} /></td>}
                    {cols.map((c) => <td key={c.key} className={cn('px-3 py-2.5 align-middle', c.className)}>{c.render ? c.render(row) : row[c.key] ?? '—'}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="divide-y md:hidden">
            {pageRows.map((row) => (
              <div key={row.id} onClick={() => onRowClick?.(row)} className="space-y-2 px-4 py-3 active:bg-muted/50">
                <div className="text-[13px] font-medium">{cols[0].render ? cols[0].render(row) : row[cols[0].key]}</div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {cols.slice(1).filter((c) => c.header).map((c) => (
                    <div key={c.key} className="min-w-0">
                      <dt className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">{c.header}</dt>
                      <dd className="truncate text-[12px]">{c.render ? c.render(row) : row[c.key] ?? '—'}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
          <TablePagination page={page} pageSize={pageSize} total={filtered.length} onPage={setPage} />
        </>
      )}
    </div>
  );
}
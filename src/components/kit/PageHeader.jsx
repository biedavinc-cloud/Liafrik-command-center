import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useT } from '@/lib/i18n/I18nProvider';
import DemoBadge from './DemoBadge';

export function Breadcrumbs({ items = [] }) {
  const { t } = useT();
  const all = [{ label: t('brand.short'), to: '/' }, ...items];
  return (
    <nav className="mb-2 flex flex-wrap items-center gap-1 text-[11.5px] text-muted-foreground">
      {all.map((it, i) => (
        <span key={i} className="inline-flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3 w-3 opacity-50" />}
          {it.to && i < all.length - 1 ? (
            <Link to={it.to} className="transition-colors hover:text-foreground">{it.label}</Link>
          ) : (
            <span className={i === all.length - 1 ? 'text-foreground/80' : ''}>{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export default function PageHeader({ title, subtitle, actions, breadcrumbs, demo }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
        <div className="flex items-center gap-2.5">
          <h1 className="truncate text-[20px] font-semibold tracking-tight">{title}</h1>
          {demo && <DemoBadge />}
        </div>
        {subtitle && <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
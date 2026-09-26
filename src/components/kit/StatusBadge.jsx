import React from 'react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n/I18nProvider';

const TONE = {
  online: 'emerald', connected: 'emerald', successful: 'emerald', active: 'emerald', success: 'emerald', passed: 'emerald',
  degraded: 'amber', warning: 'amber', pending: 'amber',
  building: 'sky', deploying: 'sky', configured: 'sky', connecting: 'sky', info: 'sky',
  compatible: 'emerald', incompatible: 'rose',
  offline: 'rose', error: 'rose', failed: 'rose', failure: 'rose', suspended: 'rose', revoked: 'rose', critical: 'rose',
};
const STYLES = {
  emerald: ['bg-emerald-50 text-emerald-700 ring-emerald-600/15', 'bg-emerald-500'],
  amber: ['bg-amber-50 text-amber-700 ring-amber-600/15', 'bg-amber-500'],
  sky: ['bg-sky-50 text-sky-700 ring-sky-600/15', 'bg-sky-500'],
  rose: ['bg-rose-50 text-rose-700 ring-rose-600/15', 'bg-rose-500'],
  slate: ['bg-slate-50 text-slate-600 ring-slate-500/15', 'bg-slate-400'],
};

export function StatusDot({ value, pulse, className }) {
  const [, dot] = STYLES[TONE[value] || 'slate'];
  return (
    <span className={cn('relative inline-flex h-2 w-2 shrink-0', className)}>
      {pulse && value === 'online' && <span className={cn('absolute inset-0 animate-ping rounded-full opacity-40', dot)} />}
      <span className={cn('relative inline-flex h-2 w-2 rounded-full', dot)} />
    </span>
  );
}

export default function StatusBadge({ value, className, pulse }) {
  const { t } = useT();
  const [chip] = STYLES[TONE[value] || 'slate'];
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded px-1.5 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.06em] ring-1 ring-inset', chip, className)}>
      <StatusDot value={value} pulse={pulse} className="h-1.5 w-1.5 [&>span]:h-1.5 [&>span]:w-1.5" />
      {t(`status.${value || 'unknown'}`)}
    </span>
  );
}
import React from 'react';
import { AlertTriangle, Wrench, Eye, Ban } from 'lucide-react';
import { useT } from '@/lib/i18n/I18nProvider';
import { isInMaintenance } from '@/lib/protocol/connector';

const ICON = { maintenance: Wrench, read_only: Eye, disabled: Ban };
const STYLE = {
  maintenance: 'border-amber-200 bg-amber-50/80 text-amber-800',
  read_only: 'border-sky-200 bg-sky-50/80 text-sky-800',
  disabled: 'border-rose-200 bg-rose-50/80 text-rose-800',
};

export default function MaintenanceBanner({ app }) {
  const { t } = useT();
  if (!app || !isInMaintenance(app)) return null;
  const Icon = ICON[app.maintenance_mode] || AlertTriangle;
  return (
    <div className={`mb-4 flex items-center gap-3 rounded-lg border px-4 py-2.5 text-[12.5px] ${STYLE[app.maintenance_mode]}`}>
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{t('maintenance.banner', { name: app.name })}</span>
      <span className="shrink-0 text-[11px] font-medium uppercase tracking-wider">{t(`maintenance.${app.maintenance_mode}`)}</span>
    </div>
  );
}
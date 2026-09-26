import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useApplications } from '@/lib/data/hooks';
import { ecosystemStatus } from '@/lib/status';
import { useT } from '@/lib/i18n/I18nProvider';
import { StatusDot } from '@/components/kit/StatusBadge';

export default function SystemStatus({ className }) {
  const { t } = useT();
  const { data: apps = [] } = useApplications();
  const status = ecosystemStatus(apps);
  return (
    <Link to="/monitoring" className={cn('items-center gap-2 rounded-md px-2 py-1.5 text-[11.5px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground', className)}>
      <StatusDot value={status} pulse />
      {t(`systemStatus.${status}`)}
    </Link>
  );
}
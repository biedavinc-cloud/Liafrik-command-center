import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/I18nProvider';
import { exportCsv } from '@/lib/exportCsv';
import Panel from './Panel';
import DemoBadge from './DemoBadge';

export const chartTooltipStyle = {
  contentStyle: { borderRadius: 6, border: '1px solid hsl(var(--border))', fontSize: 12, boxShadow: '0 8px 24px -12px rgba(16,24,40,.25)', fontFamily: 'Poppins' },
  labelStyle: { fontWeight: 600, marginBottom: 4 },
};
export const axisProps = { tick: { fontSize: 10.5, fill: 'hsl(var(--muted-foreground))' }, axisLine: false, tickLine: false };

export default function ChartCard({ title, subtitle, data, exportKeys, exportName, demo = true, actions, children, className }) {
  const { t } = useT();
  return (
    <Panel
      title={title}
      subtitle={subtitle}
      className={className}
      actions={
        <>
          {actions}
          {demo && <DemoBadge />}
          {data && (
            <Button variant="ghost" size="icon" className="h-7 w-7" title={t('table.export')} onClick={() => exportCsv(exportName || 'chart', [{ key: 'label', header: 'label' }, ...exportKeys.map((k) => ({ key: k, header: k }))], data)}>
              <Download className="h-3.5 w-3.5" />
            </Button>
          )}
        </>
      }
    >
      {children}
    </Panel>
  );
}
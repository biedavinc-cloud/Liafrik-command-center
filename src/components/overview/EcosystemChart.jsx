import React, { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useT } from '@/lib/i18n/I18nProvider';
import { buildSeries } from '@/lib/demoSeries';
import ChartCard, { axisProps, chartTooltipStyle } from '@/components/kit/ChartCard';
import Segmented from '@/components/kit/Segmented';

const METRICS = ['activity', 'revenue', 'users', 'api'];

export default function EcosystemChart({ apps, range, custom, className }) {
  const { t, fmt, locale } = useT();
  const [metric, setMetric] = useState('activity');
  const data = useMemo(() => buildSeries(range, apps, locale, custom), [range, apps, locale, custom]);
  const format = metric === 'revenue' ? (v) => fmt.currency(v) : (v) => fmt.number(v);

  return (
    <ChartCard
      className={className}
      title={t('overview.ecosystemTitle')}
      subtitle={t('overview.ecosystemSub')}
      data={data}
      exportKeys={METRICS}
      exportName="ecosystem"
      actions={<Segmented value={metric} onChange={setMetric} options={METRICS.map((m) => ({ value: m, label: t(`metric.${m}`) }))} className="hidden sm:inline-flex" />}
    >
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="ecoFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--brand))" stopOpacity={0.22} />
                <stop offset="100%" stopColor="hsl(var(--brand))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
            <XAxis dataKey="label" {...axisProps} minTickGap={24} />
            <YAxis {...axisProps} tickFormatter={(v) => fmt.compact(v)} width={48} />
            <Tooltip {...chartTooltipStyle} formatter={(v) => [format(v), t(`metric.${metric}`)]} />
            <Area type="monotone" dataKey={metric} stroke="hsl(var(--brand))" strokeWidth={1.8} fill="url(#ecoFill)" animationDuration={500} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
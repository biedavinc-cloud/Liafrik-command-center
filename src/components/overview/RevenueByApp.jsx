import React from 'react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useT } from '@/lib/i18n/I18nProvider';
import ChartCard, { axisProps, chartTooltipStyle } from '@/components/kit/ChartCard';

export default function RevenueByApp({ apps }) {
  const { t, fmt } = useT();
  const data = apps.filter((a) => a.revenue > 0).sort((a, b) => b.revenue - a.revenue).map((a) => ({ label: a.name, revenue: a.revenue, color: a.icon_color }));
  return (
    <ChartCard title={t('overview.revenueByApp')} subtitle={t('overview.revenueByAppSub')} data={data} exportKeys={['revenue']} exportName="revenue-by-application">
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 12, top: 4, bottom: 0 }}>
            <XAxis type="number" {...axisProps} tickFormatter={(v) => fmt.compact(v)} />
            <YAxis type="category" dataKey="label" {...axisProps} width={112} />
            <Tooltip {...chartTooltipStyle} cursor={{ fill: 'hsl(var(--muted))' }} formatter={(v) => [fmt.currency(v), t('metric.revenue')]} />
            <Bar dataKey="revenue" radius={[0, 3, 3, 0]} barSize={14} animationDuration={500}>
              {data.map((d) => <Cell key={d.label} fill={d.color || 'hsl(var(--brand))'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
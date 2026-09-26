// Deterministic sample time series for charts. Clearly labelled as demo data in the UI.
// Replaced by LCP /metrics aggregation once apps are connected.
const RANGES = {
  today: { points: 24, stepMs: 3600e3, fmt: { hour: '2-digit' } },
  '7d': { points: 7, stepMs: 864e5, fmt: { weekday: 'short' } },
  '30d': { points: 30, stepMs: 864e5, fmt: { day: 'numeric', month: 'short' } },
  '90d': { points: 13, stepMs: 7 * 864e5, fmt: { day: 'numeric', month: 'short' } },
  '12m': { points: 12, stepMs: 30.4 * 864e5, fmt: { month: 'short' } },
};

const rng = (seed) => () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);

export function buildSeries(range, apps, locale, custom) {
  let cfg = RANGES[range] || RANGES['30d'];
  let end = Date.now();
  if (range === 'custom' && custom?.from && custom?.to) {
    const days = Math.max(1, Math.round((new Date(custom.to) - new Date(custom.from)) / 864e5) + 1);
    cfg = { points: Math.min(days, 60), stepMs: (days / Math.min(days, 60)) * 864e5, fmt: { day: 'numeric', month: 'short' } };
    end = new Date(custom.to).getTime();
  }
  const r = rng(cfg.points * 7 + apps.length);
  const df = new Intl.DateTimeFormat(locale, cfg.fmt);
  return Array.from({ length: cfg.points }, (_, i) => {
    const trend = 0.75 + (i / cfg.points) * 0.35;
    const row = { label: df.format(new Date(end - (cfg.points - 1 - i) * cfg.stepMs)) };
    let revenue = 0;
    apps.forEach((a) => {
      const v = Math.round(((a.revenue || 0) / cfg.points) * trend * (0.7 + r() * 0.6));
      row[a.slug] = v;
      revenue += v;
    });
    row.revenue = revenue;
    row.activity = Math.round(820 * trend * (0.7 + r() * 0.6));
    row.users = Math.round(28000 + i * (3200 / cfg.points) + r() * 300);
    row.api = Math.round(42000 * trend * (0.7 + r() * 0.6));
    return row;
  });
}
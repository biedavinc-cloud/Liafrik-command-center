// Observability service: health scoring and aggregated metrics.
import { healthScore, deriveStatus, avgUptime } from '@/lib/status';

export function appHealthScore(app) {
  return healthScore(app);
}

export function ecosystemHealthScore(apps) {
  const active = apps.filter((a) => a.lifecycle === 'active');
  if (!active.length) return { score: null, status: 'insufficient_data', missing: ['applications'] };

  const scores = active.map(appHealthScore).filter((s) => s.score !== null);
  if (scores.length < active.length / 2) {
    return { score: null, status: 'insufficient_data', missing: ['majority of applications have no health data'] };
  }
  const avg = Math.round(scores.reduce((s, v) => s + v.score, 0) / scores.length);
  return {
    score: avg,
    status: avg >= 90 ? 'healthy' : avg >= 70 ? 'degraded' : 'unhealthy',
    missing: [],
  };
}

export function ecosystemMetrics(apps) {
  const active = apps.filter((a) => a.lifecycle === 'active');
  return {
    totalApplications: active.length,
    online: active.filter((a) => deriveStatus(a) === 'online').length,
    degraded: active.filter((a) => deriveStatus(a) === 'degraded').length,
    offline: active.filter((a) => deriveStatus(a) === 'offline').length,
    unknown: active.filter((a) => deriveStatus(a) === 'unknown').length,
    avgUptime: avgUptime(active),
    totalUsers: active.reduce((s, a) => s + (a.users_count || 0), 0),
    totalTransactions: active.reduce((s, a) => s + (a.transactions || 0), 0),
    totalRevenue: active.reduce((s, a) => s + (a.revenue || 0), 0),
    totalApiRequests: active.reduce((s, a) => s + (a.request_count || 0), 0),
  };
}
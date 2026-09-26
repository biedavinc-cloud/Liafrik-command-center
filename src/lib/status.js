// Health derivation from heartbeats. Demo apps keep their declared status (they send no heartbeats).
export const HEALTH_STATUSES = ['online', 'degraded', 'warning', 'offline', 'unknown'];

// Expanded connection states for Phase 2
export const CONNECTION_STATUSES = [
  'connected', 'connecting', 'not_connected', 'configured', 'pending', 'degraded', 'error', 'disabled', 'archived',
];

// Maintenance modes
export const MAINTENANCE_MODES = ['normal', 'maintenance', 'read_only', 'disabled'];

export function deriveStatus(app) {
  if (!app) return 'unknown';
  if (app.lifecycle === 'archived') return 'offline';
  if (app.lifecycle === 'disabled') return 'offline';
  if (app.maintenance_mode === 'maintenance' || app.maintenance_mode === 'read_only') return 'warning';
  if (app.is_demo) return app.status || 'unknown';
  if (!app.last_heartbeat) return 'unknown';
  const age = (Date.now() - new Date(app.last_heartbeat).getTime()) / 1000;
  const interval = app.heartbeat_interval_sec || 60;
  if (age <= interval * 2) return 'online';
  if (age <= interval * 5) return 'degraded';
  return 'offline';
}

export function ecosystemStatus(apps) {
  const active = apps.filter((a) => a.lifecycle !== 'archived' && a.lifecycle !== 'disabled');
  const statuses = active.map(deriveStatus);
  if (statuses.includes('offline')) return 'offline';
  if (statuses.some((s) => s === 'degraded' || s === 'warning')) return 'degraded';
  if (statuses.length && statuses.every((s) => s === 'online')) return 'online';
  return 'unknown';
}

export const avgUptime = (apps) => {
  const vals = apps.filter((a) => typeof a.uptime === 'number').map((a) => a.uptime);
  return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
};

// Health scoring framework — computes a score from available signals.
// Returns INSUFFICIENT DATA when signals are missing.
export function healthScore(app) {
  if (!app) return { score: null, status: 'insufficient_data', missing: ['app'] };
  if (app.is_demo) return { score: app.uptime || null, status: 'demo', missing: [] };

  const signals = {
    availability: deriveStatus(app) === 'online',
    latency: typeof app.response_ms === 'number' && app.response_ms < 1000,
    error_rate: typeof app.error_rate === 'number' && app.error_rate < 5,
    heartbeat: !!app.last_heartbeat,
    webhook_health: app.capabilities?.includes('webhooks') ? app.connection_status === 'connected' : null,
    auth_health: app.connection_status === 'connected',
    deployment: !!app.last_deployment,
  };

  const present = Object.values(signals).filter((v) => v !== null);
  const missing = Object.entries(signals).filter(([, v]) => v === null).map(([k]) => k);

  if (present.length < 4) {
    return { score: null, status: 'insufficient_data', missing: [...missing, ...present.filter((v) => !v).map((_, i) => `signal_${i}`)] };
  }

  const passed = present.filter(Boolean).length;
  const score = Math.round((passed / present.length) * 100);
  return { score, status: score >= 90 ? 'healthy' : score >= 70 ? 'degraded' : 'unhealthy', missing };
}
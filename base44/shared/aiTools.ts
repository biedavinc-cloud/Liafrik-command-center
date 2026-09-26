import { neonRepo } from './neonRepo.ts';

// ─────────────────────────────────────────────────────────────
// AI Data Tools — secure, permission-aware data access for AI.
// All data is read from Neon via neonRepo. Sensitive fields are
// sanitized before being passed to the AI provider.
// ─────────────────────────────────────────────────────────────

// Fields to strip from records before sending to AI — never expose
const SENSITIVE_FIELDS = [
  'credential_hint', 'client_id', 'registration_token_hint', 'key_hint',
  'secret_hint', 'hint', 'token', 'ip', 'user_agent', 'created_by_id',
];

function sanitize<T extends Record<string, any>>(record: T): Partial<T> {
  if (!record || typeof record !== 'object') return record;
  const clean: any = {};
  for (const key of Object.keys(record)) {
    if (SENSITIVE_FIELDS.includes(key)) continue;
    clean[key] = record[key];
  }
  return clean;
}

function sanitizeList<T extends Record<string, any>>(records: T[]): Partial<T>[] {
  return (records || []).map(sanitize);
}

// ── Tool: System Overview ──
export async function getSystemOverview() {
  const [apps, incidents, admins, audit, systemStates] = await Promise.all([
    neonRepo('Application').list('-updated_date', 200),
    neonRepo('Incident').filter({ status: 'open' }, '-created_date', 50),
    neonRepo('Administrator').list('full_name', 100),
    neonRepo('AuditEvent').list('-created_date', 20),
    neonRepo('SystemState').filter({ key: 'global' }),
  ]);

  const appsByStatus = apps.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    systemState: sanitize(systemStates[0] || {}),
    applicationCount: apps.length,
    applicationsByStatus: appsByStatus,
    openIncidentCount: incidents.length,
    administratorCount: admins.length,
    recentAuditEvents: sanitizeList(audit).map((e: any) => ({
      actor: e.actor,
      action: e.action,
      resource: e.resource,
      outcome: e.outcome,
      risk_level: e.risk_level,
      created_date: e.created_date,
    })),
  };
}

// ── Tool: Applications ──
export async function getApplications() {
  const apps = await neonRepo('Application').list('name', 200);
  return sanitizeList(apps).map((a: any) => ({
    id: a.id,
    name: a.name,
    slug: a.slug,
    type: a.type,
    status: a.status,
    environment: a.environment,
    connection_status: a.connection_status,
    maintenance_mode: a.maintenance_mode,
    capabilities: a.capabilities,
    users_count: a.users_count,
    revenue: a.revenue,
    uptime: a.uptime,
    response_ms: a.response_ms,
    error_rate: a.error_rate,
    last_heartbeat: a.last_heartbeat,
    last_deployment: a.last_deployment,
    lifecycle: a.lifecycle,
    locked: a.locked,
  }));
}

// ── Tool: Application Detail ──
export async function getApplicationDetail(appId: string) {
  const app = await neonRepo('Application').get(appId);
  if (!app) return null;
  const [envs, deps, incidents, apiLogs, configs, keys] = await Promise.all([
    neonRepo('ApplicationEnvironment').filter({ application_id: appId }, 'name'),
    neonRepo('Deployment').filter({ application_id: appId }, '-deployed_at', 20),
    neonRepo('Incident').filter({ application_id: appId }, '-created_date', 10),
    neonRepo('ApiLog').filter({ application_id: appId }, '-created_date', 50),
    neonRepo('AppConfig').filter({ application_id: appId }, 'section'),
    neonRepo('ApiKey').filter({ application_id: appId }, '-created_date', 20),
  ]);

  return {
    application: sanitize(app),
    environments: sanitizeList(envs),
    recentDeployments: sanitizeList(deps),
    incidents: sanitizeList(incidents),
    recentApiLogs: sanitizeList(apiLogs).map((l: any) => ({
      endpoint: l.endpoint,
      method: l.method,
      status: l.status,
      latency_ms: l.latency_ms,
      environment: l.environment,
      error: l.error,
      created_date: l.created_date,
    })),
    configs: sanitizeList(configs).map((c: any) => ({
      section: c.section,
      key: c.key,
      value: c.is_secret ? '[REDACTED]' : c.value,
      value_type: c.value_type,
      is_secret: c.is_secret,
      is_configured: c.is_configured,
      environment: c.environment,
    })),
    apiKeys: sanitizeList(keys).map((k: any) => ({
      name: k.name,
      environment: k.environment,
      status: k.status,
      scopes: k.scopes,
      last_used: k.last_used,
      expires_at: k.expires_at,
    })),
  };
}

// ── Tool: Incidents ──
export async function getIncidents(status?: string) {
  const query = status ? { status } : {};
  const incidents = await neonRepo('Incident').filter(query, '-created_date', 100);
  return sanitizeList(incidents);
}

// ── Tool: Incident Detail (with correlated data) ──
export async function getIncidentContext(incidentId: string) {
  const incident = await neonRepo('Incident').get(incidentId);
  if (!incident) return null;

  const appId = incident.application_id;
  const [app, recentDeps, apiLogs, auditEvents, activity, configs, changes] = await Promise.all([
    neonRepo('Application').get(appId),
    neonRepo('Deployment').filter({ application_id: appId }, '-deployed_at', 10),
    neonRepo('ApiLog').filter({ application_id: appId }, '-created_date', 50),
    neonRepo('AuditEvent').filter({ application_id: appId }, '-created_date', 30),
    neonRepo('ActivityEvent').filter({ application_id: appId }, '-occurred_at', 30),
    neonRepo('AppConfig').filter({ application_id: appId, environment: incident.environment }, 'section'),
    neonRepo('ChangeRecord').filter({ application_id: appId }, '-created_date', 20),
  ]);

  return {
    incident: sanitize(incident),
    application: app ? sanitize(app) : null,
    recentDeployments: sanitizeList(recentDeps),
    recentApiLogs: sanitizeList(apiLogs).map((l: any) => ({
      endpoint: l.endpoint, method: l.method, status: l.status,
      latency_ms: l.latency_ms, error: l.error, created_date: l.created_date,
    })),
    recentAuditEvents: sanitizeList(auditEvents).map((e: any) => ({
      actor: e.actor, action: e.action, resource: e.resource,
      outcome: e.outcome, risk_level: e.risk_level, created_date: e.created_date,
    })),
    recentActivity: sanitizeList(activity).map((a: any) => ({
      message: a.message, kind: a.kind, severity: a.severity,
      occurred_at: a.occurred_at, environment: a.environment,
    })),
    recentConfigChanges: sanitizeList(changes).map((c: any) => ({
      field: c.field, before: c.before, after: c.after,
      changed_by: c.changed_by, section: c.section, created_date: c.created_date,
    })),
    configs: sanitizeList(configs).map((c: any) => ({
      section: c.section, key: c.key,
      value: c.is_secret ? '[REDACTED]' : c.value,
      is_secret: c.is_secret, is_configured: c.is_configured,
    })),
  };
}

// ── Tool: Audit Events ──
export async function getAuditEvents(limit = 100) {
  const events = await neonRepo('AuditEvent').list('-created_date', limit);
  return sanitizeList(events).map((e: any) => ({
    actor: e.actor, actor_role: e.actor_role, action: e.action,
    resource: e.resource, resource_id: e.resource_id, outcome: e.outcome,
    risk_level: e.risk_level, environment: e.environment,
    application_name: e.application_name, created_date: e.created_date,
  }));
}

// ── Tool: API Logs ──
export async function getApiLogs(appId?: string) {
  const query = appId ? { application_id: appId } : {};
  const logs = await neonRepo('ApiLog').filter(query, '-created_date', 200);
  return sanitizeList(logs).map((l: any) => ({
    application_name: l.application_name, endpoint: l.endpoint,
    method: l.method, status: l.status, latency_ms: l.latency_ms,
    environment: l.environment, error: l.error, created_date: l.created_date,
  }));
}

// ── Tool: Security Events ──
export async function getSecurityEvents() {
  const events = await neonRepo('SecurityEvent').list('-created_date', 100);
  return sanitizeList(events).map((e: any) => ({
    type: e.type, severity: e.severity, actor: e.actor,
    description: e.description, application_name: e.application_name,
    created_date: e.created_date,
  }));
}

// ── Tool: Sessions ──
export async function getSessions() {
  const sessions = await neonRepo('Session').filter({ status: 'active' }, '-last_active', 100);
  return sanitizeList(sessions).map((s: any) => ({
    user_name: s.user_name, user_email: s.user_email,
    device: s.device, browser: s.browser, os: s.os,
    location: s.location, application_name: s.application_name,
    status: s.status, last_active: s.last_active, created_date: s.created_date,
  }));
}

// ── Tool: Deployments ──
export async function getDeployments(appId?: string) {
  const query = appId ? { application_id: appId } : {};
  const deps = await neonRepo('Deployment').filter(query, '-deployed_at', 50);
  return sanitizeList(deps);
}

// ── Tool: Administrators ──
export async function getAdministrators() {
  const admins = await neonRepo('Administrator').list('full_name', 100);
  return sanitizeList(admins).map((a: any) => ({
    full_name: a.full_name, email: a.email, global_role: a.global_role,
    status: a.status, mfa_enabled: a.mfa_enabled, last_active: a.last_active,
    assignment_count: (a.assignments || []).length,
  }));
}

// ── Tool: AIOps Snapshot — comprehensive operational data for anomaly analysis ──
export async function getOpsSnapshot() {
  const [apps, apiLogs, incidents, deployments, audit, activity, webhooks] = await Promise.all([
    neonRepo('Application').list('name', 200),
    neonRepo('ApiLog').list('-created_date', 500),
    neonRepo('Incident').list('-created_date', 50),
    neonRepo('Deployment').list('-deployed_at', 50),
    neonRepo('AuditEvent').list('-created_date', 100),
    neonRepo('ActivityEvent').list('-occurred_at', 100),
    neonRepo('WebhookConfig').list('-created_date', 50),
  ]);

  // Compute error rate per application
  const logsByApp = {} as Record<string, any[]>;
  for (const log of apiLogs) {
    const key = log.application_name || log.application_id;
    (logsByApp[key] ||= []).push(log);
  }

  const appErrorRates = Object.entries(logsByApp).map(([appName, logs]) => {
    const errors = logs.filter((l) => l.status >= 400).length;
    const avgLatency = logs.reduce((sum, l) => sum + (l.latency_ms || 0), 0) / (logs.length || 1);
    return {
      application: appName,
      totalRequests: logs.length,
      errorCount: errors,
      errorRate: logs.length ? (errors / logs.length) * 100 : 0,
      avgLatencyMs: Math.round(avgLatency),
    };
  });

  // Webhook failure summary
  const webhookHealth = sanitizeList(webhooks).map((w: any) => ({
    application_name: w.application_name, event: w.event,
    status: w.status, success_count: w.success_count,
    failure_count: w.failure_count, last_status: w.last_status,
  }));

  return {
    applications: sanitizeList(apps).map((a: any) => ({
      name: a.name, status: a.status, connection_status: a.connection_status,
      maintenance_mode: a.maintenance_mode, uptime: a.uptime,
      response_ms: a.response_ms, error_rate: a.error_rate,
      users_count: a.users_count, environment: a.environment,
    })),
    apiErrorRates: appErrorRates,
    openIncidents: sanitizeList(incidents.filter((i) => i.status === 'open' || i.status === 'investigating')),
    recentDeployments: sanitizeList(deployments).map((d: any) => ({
      application_name: d.application_name, environment: d.environment,
      version: d.version, status: d.status, deployed_at: d.deployed_at,
      source: d.source,
    })),
    recentAuditEvents: sanitizeList(audit).slice(0, 30).map((e: any) => ({
      actor: e.actor, action: e.action, risk_level: e.risk_level,
      outcome: e.outcome, created_date: e.created_date,
    })),
    webhookHealth,
  };
}

// ── Tool: Security Snapshot ──
export async function getSecuritySnapshot() {
  const [securityEvents, sessions, audit, admins, apiKeys] = await Promise.all([
    neonRepo('SecurityEvent').list('-created_date', 100),
    neonRepo('Session').list('-last_active', 100),
    neonRepo('AuditEvent').filter({ outcome: 'failure' }, '-created_date', 50),
    neonRepo('Administrator').list('full_name', 100),
    neonRepo('ApiKey').list('-created_date', 50),
  ]);

  return {
    securityEvents: sanitizeList(securityEvents).map((e: any) => ({
      type: e.type, severity: e.severity, actor: e.actor,
      description: e.description, application_name: e.application_name,
      created_date: e.created_date,
    })),
    activeSessions: sanitizeList(sessions).map((s: any) => ({
      user_name: s.user_name, user_email: s.user_email,
      device: s.device, browser: s.browser, os: s.os,
      location: s.location, application_name: s.application_name,
      last_active: s.last_active,
    })),
    failedAuditEvents: sanitizeList(audit).map((e: any) => ({
      actor: e.actor, action: e.action, resource: e.resource,
      risk_level: e.risk_level, created_date: e.created_date,
    })),
    administrators: sanitizeList(admins).map((a: any) => ({
      full_name: a.full_name, email: a.email, global_role: a.global_role,
      status: a.status, mfa_enabled: a.mfa_enabled,
      assignment_count: (a.assignments || []).length,
    })),
    apiKeys: sanitizeList(apiKeys).map((k: any) => ({
      application_name: k.application_name, name: k.name,
      environment: k.environment, status: k.status,
      scopes: k.scopes, last_used: k.last_used, expires_at: k.expires_at,
    })),
  };
}

// ── Tool: Application Onboarding Analysis ──
export async function getOnboardingData(appId: string) {
  const app = await neonRepo('Application').get(appId);
  if (!app) return null;

  const [envs, configs, keys, webhooks] = await Promise.all([
    neonRepo('ApplicationEnvironment').filter({ application_id: appId }, 'name'),
    neonRepo('AppConfig').filter({ application_id: appId }, 'section'),
    neonRepo('ApiKey').filter({ application_id: appId }, '-created_date'),
    neonRepo('WebhookConfig').filter({ application_id: appId }, '-created_date'),
  ]);

  return {
    application: {
      name: app.name,
      slug: app.slug,
      type: app.type,
      environment: app.environment,
      auth_method: app.auth_method,
      api_version: app.api_version,
      protocol_version: app.protocol_version,
      connector_version: app.connector_version,
      capabilities: app.capabilities || [],
      connection_status: app.connection_status,
      compatibility_status: app.compatibility_status,
      maintenance_mode: app.maintenance_mode,
      sso_enabled: app.sso_enabled,
      allowed_origins: app.allowed_origins || [],
      rate_limit: app.rate_limit,
    },
    environments: sanitizeList(envs).map((e: any) => ({
      name: e.name, url: e.url, version: e.version,
      status: e.status, api_status: e.api_status, health: e.health,
    })),
    configs: sanitizeList(configs).map((c: any) => ({
      section: c.section, key: c.key,
      value: c.is_secret ? '[REDACTED]' : c.value,
      value_type: c.value_type, is_secret: c.is_secret,
      is_configured: c.is_configured, environment: c.environment,
    })),
    apiKeys: sanitizeList(keys).map((k: any) => ({
      name: k.name, environment: k.environment, status: k.status,
      scopes: k.scopes,
    })),
    webhooks: sanitizeList(webhooks).map((w: any) => ({
      event: w.event, status: w.status,
    })),
  };
}

// ── Tool: Natural-language search across the platform ──
export async function searchPlatform(query: string) {
  const lower = query.toLowerCase();
  const [apps, incidents, audit, admins, activity] = await Promise.all([
    neonRepo('Application').list('name', 200),
    neonRepo('Incident').list('-created_date', 50),
    neonRepo('AuditEvent').list('-created_date', 200),
    neonRepo('Administrator').list('full_name', 100),
    neonRepo('ActivityEvent').list('-occurred_at', 200),
  ]);

  const matchApps = apps.filter((a) =>
    a.name?.toLowerCase().includes(lower) ||
    a.slug?.toLowerCase().includes(lower) ||
    a.type?.toLowerCase().includes(lower) ||
    a.status?.toLowerCase().includes(lower),
  );

  const matchIncidents = incidents.filter((i) =>
    i.title?.toLowerCase().includes(lower) ||
    i.description?.toLowerCase().includes(lower) ||
    i.application_name?.toLowerCase().includes(lower),
  );

  const matchAudit = audit.filter((e) =>
    e.action?.toLowerCase().includes(lower) ||
    e.actor?.toLowerCase().includes(lower) ||
    e.resource?.toLowerCase().includes(lower),
  );

  const matchAdmins = admins.filter((a) =>
    a.full_name?.toLowerCase().includes(lower) ||
    a.email?.toLowerCase().includes(lower),
  );

  const matchActivity = activity.filter((a) =>
    a.message?.toLowerCase().includes(lower) ||
    a.application_name?.toLowerCase().includes(lower),
  );

  return {
    applications: sanitizeList(matchApps.slice(0, 10)).map((a: any) => ({
      name: a.name, slug: a.slug, status: a.status, type: a.type,
      environment: a.environment,
    })),
    incidents: sanitizeList(matchIncidents.slice(0, 10)).map((i: any) => ({
      title: i.title, severity: i.severity, status: i.status,
      application_name: i.application_name, environment: i.environment,
    })),
    auditEvents: sanitizeList(matchAudit.slice(0, 10)).map((e: any) => ({
      actor: e.actor, action: e.action, resource: e.resource,
      outcome: e.outcome, created_date: e.created_date,
    })),
    administrators: sanitizeList(matchAdmins.slice(0, 5)).map((a: any) => ({
      full_name: a.full_name, email: a.email, global_role: a.global_role,
      status: a.status,
    })),
    activity: sanitizeList(matchActivity.slice(0, 10)).map((a: any) => ({
      message: a.message, application_name: a.application_name,
      severity: a.severity, occurred_at: a.occurred_at,
    })),
  };
}
// Shared helpers for Cloudflare Pages Functions (ported from base44/shared/neonClient.ts).
import { neon } from '@neondatabase/serverless';

export function createSql(env) {
  const connStr = env.DATABASE_URL || env.NEON_CONNECTION_STRING;
  if (!connStr) throw new Error('DATABASE_URL is not set');
  return neon(connStr);
}

export const TABLE_MAP = {
  Application: 'applications', ApplicationEnvironment: 'application_environments',
  Deployment: 'deployments', Administrator: 'administrators', Role: 'roles',
  AuditEvent: 'audit_events', Notification: 'notifications', ActivityEvent: 'activity_events',
  Integration: 'integrations', ApiKey: 'api_keys', WebhookConfig: 'webhook_configs',
  Incident: 'incidents', NotificationRule: 'notification_rules', ApiLog: 'api_logs',
  SecurityEvent: 'security_events', Session: 'sessions', ChangeRecord: 'change_records',
  Secret: 'secrets', SystemState: 'system_states', AppConfig: 'app_configs',
  AutomationRule: 'automation_rules', Invitation: 'invitations', AiActivity: 'ai_activities',
  Branding: 'branding', CurrencyRate: 'currency_rates', StaffProfile: 'staff_profiles',
  PaymentProvider: 'payment_providers', PaymentLink: 'payment_links', StaffTask: 'staff_tasks',
  Message: 'messages', Conversation: 'conversations', OutboundMessage: 'outbound_messages',
  CommunicationChannel: 'communication_channels',
};

export const NUMERIC_COLUMNS = {
  applications: ['users_count', 'transactions', 'revenue', 'uptime', 'response_ms', 'error_rate', 'request_count', 'heartbeat_interval_sec', 'rate_limit'],
  ai_activities: ['latency_ms', 'tokens_used'],
  application_environments: ['health'],
  deployments: ['duration_sec'],
  roles: ['rank'],
  webhook_configs: ['last_status', 'success_count', 'failure_count', 'retry_count'],
  notification_rules: ['fire_count'],
  api_logs: ['status', 'latency_ms'],
  automation_rules: ['fire_count'],
  payment_links: ['amount'],
  staff_tasks: [],
};

export const JSONB_COLUMNS = {
  applications: ['capabilities', 'allowed_origins', 'ip_restrictions'],
  administrators: ['assignments', 'permissions'],
  roles: ['permissions'],
  incidents: ['affected_services', 'timeline'],
  notification_rules: ['channels'],
  webhook_configs: ['deliveries'],
  invitations: ['assignments', 'permissions'],
  ai_activities: ['data_sources'],
  currency_rates: ['rates'],
  staff_profiles: ['notification_prefs'],
  payment_providers: ['capabilities', 'supported_currencies', 'supported_countries'],
  payment_links: ['metadata'],
  messages: ['attachments', 'mentions', 'read_by'],
  conversations: ['participants'],
  communication_channels: ['credentials', 'credential_hints'],
};

// Column names come from the client: only allow plain identifiers (prevents SQL injection).
const IDENT = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
export function ident(name) {
  if (typeof name !== 'string' || !IDENT.test(name)) throw new Error(`Invalid column name: ${name}`);
  return name;
}

export function serializeValue(table, col, value) {
  if (value === undefined) return null;
  if ((JSONB_COLUMNS[table] || []).includes(col) && value !== null) return JSON.stringify(value);
  return value;
}

export function buildWhereClause(filter, startIdx = 1) {
  if (!filter || Object.keys(filter).length === 0) return { clause: '', params: [], nextIdx: startIdx };
  const conditions = [];
  const params = [];
  let idx = startIdx;
  for (const [key, value] of Object.entries(filter)) {
    if (key === '$or' && Array.isArray(value)) {
      const orParts = [];
      for (const sub of value) {
        const s = buildWhereClause(sub, idx);
        if (s.clause) { orParts.push(`(${s.clause})`); params.push(...s.params); idx = s.nextIdx; }
      }
      if (orParts.length) conditions.push(`(${orParts.join(' OR ')})`);
      continue;
    }
    const k = ident(key);
    if (value === null || value === undefined) {
      conditions.push(`${k} IS NULL`);
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      for (const [op, v] of Object.entries(value)) {
        switch (op) {
          case '$gte': conditions.push(`${k} >= $${idx++}`); params.push(v); break;
          case '$gt': conditions.push(`${k} > $${idx++}`); params.push(v); break;
          case '$lte': conditions.push(`${k} <= $${idx++}`); params.push(v); break;
          case '$lt': conditions.push(`${k} < $${idx++}`); params.push(v); break;
          case '$ne': conditions.push(`${k} != $${idx++}`); params.push(v); break;
          case '$in': conditions.push(`${k} = ANY($${idx++})`); params.push(v); break;
          case '$nin': conditions.push(`${k} != ALL($${idx++})`); params.push(v); break;
          case '$exists': conditions.push(v ? `${k} IS NOT NULL` : `${k} IS NULL`); break;
          default: conditions.push(`${k} = $${idx++}`); params.push(v);
        }
      }
    } else {
      conditions.push(`${k} = $${idx++}`);
      params.push(value);
    }
  }
  return { clause: conditions.join(' AND '), params, nextIdx: idx };
}

export function buildSortClause(sort) {
  if (!sort) return '';
  if (sort.startsWith('-')) return `ORDER BY ${ident(sort.slice(1))} DESC`;
  return `ORDER BY ${ident(sort)} ASC`;
}

export function convertRow(table, row) {
  if (!row) return row;
  for (const col of NUMERIC_COLUMNS[table] || []) {
    if (row[col] !== null && row[col] !== undefined && typeof row[col] === 'string') row[col] = parseFloat(row[col]);
  }
  return row;
}
export const convertRows = (table, rows) => (rows || []).map((r) => convertRow(table, r));

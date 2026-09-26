import { neon } from 'npm:@neondatabase/serverless@0.10.2';
import { secrets } from 'base44:runtime';

export function createSql() {
  const connStr = secrets.get('NEON_CONNECTION_STRING');
  if (!connStr) throw new Error('NEON_CONNECTION_STRING secret is not set');
  return neon(connStr);
}

// Entity name -> PostgreSQL table name
export const TABLE_MAP: Record<string, string> = {
  Application: 'applications',
  ApplicationEnvironment: 'application_environments',
  Deployment: 'deployments',
  Administrator: 'administrators',
  Role: 'roles',
  AuditEvent: 'audit_events',
  Notification: 'notifications',
  ActivityEvent: 'activity_events',
  Integration: 'integrations',
  ApiKey: 'api_keys',
  WebhookConfig: 'webhook_configs',
  Incident: 'incidents',
  NotificationRule: 'notification_rules',
  ApiLog: 'api_logs',
  SecurityEvent: 'security_events',
  Session: 'sessions',
  ChangeRecord: 'change_records',
  Secret: 'secrets',
  SystemState: 'system_states',
  AppConfig: 'app_configs',
  AutomationRule: 'automation_rules',
  Invitation: 'invitations',
  AiActivity: 'ai_activities',
};

// Columns that are NUMERIC and need string→number conversion on read
export const NUMERIC_COLUMNS: Record<string, string[]> = {
  applications: ['users_count', 'transactions', 'revenue', 'uptime', 'response_ms', 'error_rate', 'request_count', 'heartbeat_interval_sec', 'rate_limit'],
  ai_activities: ['latency_ms', 'tokens_used'],
  application_environments: ['health'],
  deployments: ['duration_sec'],
  roles: ['rank'],
  webhook_configs: ['last_status', 'success_count', 'failure_count', 'retry_count'],
  notification_rules: ['fire_count'],
  api_logs: ['status', 'latency_ms'],
  automation_rules: ['fire_count'],
};

// Columns that are JSONB (arrays/objects) and need JSON.stringify on write
export const NUMERIC_COLUMNS_AI: Record<string, string[]> = {
  ai_activities: ['latency_ms', 'tokens_used'],
};

export const JSONB_COLUMNS: Record<string, string[]> = {
  applications: ['capabilities', 'allowed_origins', 'ip_restrictions'],
  administrators: ['assignments', 'permissions'],
  roles: ['permissions'],
  incidents: ['affected_services', 'timeline'],
  notification_rules: ['channels'],
  webhook_configs: ['deliveries'],
  invitations: ['assignments', 'permissions'],
  ai_activities: ['data_sources'],
};

function isJsonbColumn(table: string, col: string): boolean {
  return (JSONB_COLUMNS[table] || []).includes(col);
}

export function serializeValue(table: string, col: string, value: any): any {
  if (value === undefined) return null;
  if (isJsonbColumn(table, col) && value !== null) return JSON.stringify(value);
  return value;
}

// Build a WHERE clause from a Base44-style filter object
export function buildWhereClause(filter: Record<string, any>, startIdx = 1) {
  if (!filter || Object.keys(filter).length === 0) {
    return { clause: '', params: [] as any[], nextIdx: startIdx };
  }
  const conditions: string[] = [];
  const params: any[] = [];
  let idx = startIdx;

  for (const [key, value] of Object.entries(filter)) {
    if (value === null || value === undefined) {
      conditions.push(`${key} IS NULL`);
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      for (const [op, opVal] of Object.entries(value)) {
        switch (op) {
          case '$gte': conditions.push(`${key} >= $${idx++}`); params.push(opVal); break;
          case '$gt': conditions.push(`${key} > $${idx++}`); params.push(opVal); break;
          case '$lte': conditions.push(`${key} <= $${idx++}`); params.push(opVal); break;
          case '$lt': conditions.push(`${key} < $${idx++}`); params.push(opVal); break;
          case '$ne': conditions.push(`${key} != $${idx++}`); params.push(opVal); break;
          case '$in': conditions.push(`${key} = ANY($${idx++})`); params.push(opVal); break;
          case '$nin': conditions.push(`${key} != ALL($${idx++})`); params.push(opVal); break;
          case '$exists': conditions.push(opVal ? `${key} IS NOT NULL` : `${key} IS NULL`); break;
          default: conditions.push(`${key} = $${idx++}`); params.push(opVal);
        }
      }
    } else {
      conditions.push(`${key} = $${idx++}`);
      params.push(value);
    }
  }
  return { clause: conditions.join(' AND '), params, nextIdx: idx };
}

export function buildSortClause(sort: string): string {
  if (!sort) return '';
  if (sort.startsWith('-')) return `ORDER BY ${sort.slice(1)} DESC`;
  return `ORDER BY ${sort} ASC`;
}

// Convert NUMERIC strings back to JS numbers on read
export function convertRow(table: string, row: any): any {
  if (!row) return row;
  const numCols = NUMERIC_COLUMNS[table] || [];
  for (const col of numCols) {
    if (row[col] !== null && row[col] !== undefined && typeof row[col] === 'string') {
      row[col] = parseFloat(row[col]);
    }
  }
  return row;
}

export function convertRows(table: string, rows: any[]): any[] {
  return (rows || []).map(r => convertRow(table, r));
}
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { createSql } from '../../shared/neonClient.ts';

// All CREATE TABLE statements — idempotent (IF NOT EXISTS)
const DDL: string[] = [
  `CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_date TIMESTAMPTZ DEFAULT now(),
    updated_date TIMESTAMPTZ DEFAULT now(),
    created_by_id TEXT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    type TEXT DEFAULT 'saas',
    domain TEXT,
    admin_url TEXT,
    api_url TEXT,
    health_endpoint TEXT DEFAULT '/health',
    auth_method TEXT DEFAULT 'api_key',
    environment TEXT DEFAULT 'production',
    api_version TEXT DEFAULT 'v1',
    version TEXT,
    connector_version TEXT DEFAULT '1.0.0',
    protocol_version TEXT DEFAULT 'v1',
    status TEXT DEFAULT 'unknown',
    lifecycle TEXT DEFAULT 'active',
    connection_status TEXT DEFAULT 'pending',
    compatibility_status TEXT DEFAULT 'unknown',
    maintenance_mode TEXT DEFAULT 'normal',
    capabilities JSONB DEFAULT '[]',
    is_demo BOOLEAN DEFAULT false,
    icon_color TEXT,
    users_count NUMERIC DEFAULT 0,
    transactions NUMERIC DEFAULT 0,
    revenue NUMERIC DEFAULT 0,
    currency TEXT DEFAULT 'AED',
    payment_provider TEXT,
    uptime NUMERIC,
    response_ms NUMERIC,
    error_rate NUMERIC,
    request_count NUMERIC,
    last_heartbeat TIMESTAMPTZ,
    last_deployment TIMESTAMPTZ,
    last_successful_connection TIMESTAMPTZ,
    last_failed_connection TIMESTAMPTZ,
    last_failed_reason TEXT,
    heartbeat_interval_sec NUMERIC DEFAULT 60,
    sso_enabled BOOLEAN DEFAULT false,
    client_id TEXT,
    credential_hint TEXT,
    registration_token_hint TEXT,
    registration_status TEXT DEFAULT 'active',
    allowed_origins JSONB DEFAULT '[]',
    ip_restrictions JSONB DEFAULT '[]',
    rate_limit NUMERIC DEFAULT 1000,
    locked BOOLEAN DEFAULT false,
    lock_reason TEXT,
    locked_at TIMESTAMPTZ,
    locked_by TEXT,
    owner TEXT,
    repo_url TEXT,
    repo_branch TEXT,
    last_commit TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS application_environments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_date TIMESTAMPTZ DEFAULT now(),
    updated_date TIMESTAMPTZ DEFAULT now(),
    created_by_id TEXT,
    application_id TEXT NOT NULL,
    name TEXT NOT NULL,
    url TEXT,
    version TEXT,
    status TEXT DEFAULT 'unknown',
    api_status TEXT DEFAULT 'pending',
    health NUMERIC,
    last_deployment TIMESTAMPTZ,
    is_demo BOOLEAN DEFAULT false
  )`,

  `CREATE TABLE IF NOT EXISTS deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_date TIMESTAMPTZ DEFAULT now(),
    updated_date TIMESTAMPTZ DEFAULT now(),
    created_by_id TEXT,
    application_id TEXT NOT NULL,
    environment TEXT,
    version TEXT,
    commit TEXT,
    deployed_at TIMESTAMPTZ,
    status TEXT,
    duration_sec NUMERIC,
    source TEXT DEFAULT 'manual',
    is_demo BOOLEAN DEFAULT false
  )`,

  `CREATE TABLE IF NOT EXISTS administrators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_date TIMESTAMPTZ DEFAULT now(),
    updated_date TIMESTAMPTZ DEFAULT now(),
    created_by_id TEXT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    global_role TEXT DEFAULT 'none',
    status TEXT DEFAULT 'active',
    assignments JSONB DEFAULT '[]',
    permissions JSONB DEFAULT '[]',
    mfa_enabled BOOLEAN DEFAULT false,
    last_active TIMESTAMPTZ,
    is_demo BOOLEAN DEFAULT false
  )`,

  `CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_date TIMESTAMPTZ DEFAULT now(),
    updated_date TIMESTAMPTZ DEFAULT now(),
    created_by_id TEXT,
    key TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    rank NUMERIC,
    permissions JSONB DEFAULT '[]',
    is_system BOOLEAN DEFAULT false,
    locked BOOLEAN DEFAULT false
  )`,

  `CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_date TIMESTAMPTZ DEFAULT now(),
    updated_date TIMESTAMPTZ DEFAULT now(),
    created_by_id TEXT,
    actor TEXT NOT NULL,
    actor_role TEXT,
    application_id TEXT,
    application_name TEXT,
    environment TEXT,
    action TEXT NOT NULL,
    resource TEXT,
    resource_id TEXT,
    outcome TEXT DEFAULT 'success',
    risk_level TEXT DEFAULT 'low',
    correlation_id TEXT,
    ip TEXT,
    user_agent TEXT,
    before TEXT,
    after TEXT,
    is_demo BOOLEAN DEFAULT false
  )`,

  `CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_date TIMESTAMPTZ DEFAULT now(),
    updated_date TIMESTAMPTZ DEFAULT now(),
    created_by_id TEXT,
    title TEXT NOT NULL,
    body TEXT,
    severity TEXT DEFAULT 'info',
    category TEXT,
    application_id TEXT,
    read BOOLEAN DEFAULT false,
    is_demo BOOLEAN DEFAULT false
  )`,

  `CREATE TABLE IF NOT EXISTS activity_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_date TIMESTAMPTZ DEFAULT now(),
    updated_date TIMESTAMPTZ DEFAULT now(),
    created_by_id TEXT,
    application_id TEXT NOT NULL,
    application_name TEXT,
    message TEXT NOT NULL,
    kind TEXT,
    capability TEXT,
    event_type TEXT,
    severity TEXT DEFAULT 'info',
    correlation_id TEXT,
    actor TEXT,
    environment TEXT,
    occurred_at TIMESTAMPTZ,
    is_demo BOOLEAN DEFAULT false
  )`,

  `CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_date TIMESTAMPTZ DEFAULT now(),
    updated_date TIMESTAMPTZ DEFAULT now(),
    created_by_id TEXT,
    provider TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT DEFAULT 'not_connected',
    adapter TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_date TIMESTAMPTZ DEFAULT now(),
    updated_date TIMESTAMPTZ DEFAULT now(),
    created_by_id TEXT,
    application_id TEXT NOT NULL,
    application_name TEXT,
    name TEXT NOT NULL,
    environment TEXT DEFAULT 'production',
    key_hint TEXT,
    status TEXT DEFAULT 'active',
    scopes JSONB DEFAULT '[]',
    created_by TEXT,
    last_used TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    rotated_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    is_demo BOOLEAN DEFAULT false
  )`,

  `CREATE TABLE IF NOT EXISTS webhook_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_date TIMESTAMPTZ DEFAULT now(),
    updated_date TIMESTAMPTZ DEFAULT now(),
    created_by_id TEXT,
    application_id TEXT NOT NULL,
    application_name TEXT,
    event TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    secret_hint TEXT,
    last_delivery TIMESTAMPTZ,
    last_status NUMERIC,
    success_count NUMERIC DEFAULT 0,
    failure_count NUMERIC DEFAULT 0,
    retry_count NUMERIC DEFAULT 0,
    deliveries JSONB DEFAULT '[]',
    is_demo BOOLEAN DEFAULT false
  )`,

  `CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_date TIMESTAMPTZ DEFAULT now(),
    updated_date TIMESTAMPTZ DEFAULT now(),
    created_by_id TEXT,
    application_id TEXT NOT NULL,
    application_name TEXT,
    environment TEXT DEFAULT 'production',
    severity TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'open',
    title TEXT NOT NULL,
    description TEXT,
    affected_services JSONB DEFAULT '[]',
    correlation_id TEXT,
    timeline JSONB DEFAULT '[]',
    resolved_at TIMESTAMPTZ,
    is_demo BOOLEAN DEFAULT false
  )`,

  `CREATE TABLE IF NOT EXISTS notification_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_date TIMESTAMPTZ DEFAULT now(),
    updated_date TIMESTAMPTZ DEFAULT now(),
    created_by_id TEXT,
    name TEXT NOT NULL,
    trigger TEXT NOT NULL,
    conditions TEXT,
    action TEXT NOT NULL,
    application_scope TEXT,
    environment_scope TEXT,
    channels JSONB DEFAULT '[]',
    enabled BOOLEAN DEFAULT true,
    last_fired TIMESTAMPTZ,
    fire_count NUMERIC DEFAULT 0,
    is_demo BOOLEAN DEFAULT false
  )`,

  `CREATE TABLE IF NOT EXISTS api_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_date TIMESTAMPTZ DEFAULT now(),
    updated_date TIMESTAMPTZ DEFAULT now(),
    created_by_id TEXT,
    application_id TEXT NOT NULL,
    application_name TEXT,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status NUMERIC,
    latency_ms NUMERIC,
    correlation_id TEXT,
    environment TEXT DEFAULT 'production',
    error TEXT,
    is_demo BOOLEAN DEFAULT false
  )`,

  `CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_date TIMESTAMPTZ DEFAULT now(),
    updated_date TIMESTAMPTZ DEFAULT now(),
    created_by_id TEXT,
    type TEXT NOT NULL,
    severity TEXT DEFAULT 'medium',
    actor TEXT,
    ip TEXT,
    user_agent TEXT,
    description TEXT,
    application_id TEXT,
    application_name TEXT,
    correlation_id TEXT,
    is_demo BOOLEAN DEFAULT false
  )`,

  `CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_date TIMESTAMPTZ DEFAULT now(),
    updated_date TIMESTAMPTZ DEFAULT now(),
    created_by_id TEXT,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT,
    device TEXT,
    browser TEXT,
    os TEXT,
    ip TEXT,
    location TEXT,
    application_id TEXT,
    application_name TEXT,
    status TEXT DEFAULT 'active',
    last_active TIMESTAMPTZ,
    is_demo BOOLEAN DEFAULT false
  )`,

  `CREATE TABLE IF NOT EXISTS change_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_date TIMESTAMPTZ DEFAULT now(),
    updated_date TIMESTAMPTZ DEFAULT now(),
    created_by_id TEXT,
    application_id TEXT NOT NULL,
    application_name TEXT,
    field TEXT NOT NULL,
    before TEXT,
    after TEXT,
    changed_by TEXT NOT NULL,
    section TEXT,
    is_demo BOOLEAN DEFAULT false
  )`,

  `CREATE TABLE IF NOT EXISTS secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_date TIMESTAMPTZ DEFAULT now(),
    updated_date TIMESTAMPTZ DEFAULT now(),
    created_by_id TEXT,
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    environment TEXT DEFAULT 'production',
    application_id TEXT,
    status TEXT DEFAULT 'active',
    hint TEXT,
    last_rotated TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_demo BOOLEAN DEFAULT false
  )`,

  `CREATE TABLE IF NOT EXISTS system_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_date TIMESTAMPTZ DEFAULT now(),
    updated_date TIMESTAMPTZ DEFAULT now(),
    created_by_id TEXT,
    key TEXT NOT NULL UNIQUE,
    safe_mode_enabled BOOLEAN DEFAULT false,
    safe_mode_activated_by TEXT,
    safe_mode_activated_at TIMESTAMPTZ,
    safe_mode_reason TEXT,
    safe_mode_correlation_id TEXT,
    infrastructure_status TEXT DEFAULT 'not_connected',
    neon_status TEXT DEFAULT 'not_connected',
    github_status TEXT DEFAULT 'not_connected',
    cloudflare_status TEXT DEFAULT 'not_connected',
    is_demo BOOLEAN DEFAULT false
  )`,

  `CREATE TABLE IF NOT EXISTS app_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_date TIMESTAMPTZ DEFAULT now(),
    updated_date TIMESTAMPTZ DEFAULT now(),
    created_by_id TEXT,
    application_id TEXT NOT NULL,
    application_name TEXT,
    environment TEXT DEFAULT 'production',
    section TEXT DEFAULT 'setting',
    key TEXT NOT NULL,
    value TEXT,
    value_type TEXT DEFAULT 'string',
    is_secret BOOLEAN DEFAULT false,
    is_configured BOOLEAN DEFAULT false,
    description TEXT,
    last_changed_by TEXT,
    last_changed_at TIMESTAMPTZ,
    correlation_id TEXT,
    is_demo BOOLEAN DEFAULT false
  )`,

  `CREATE TABLE IF NOT EXISTS automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_date TIMESTAMPTZ DEFAULT now(),
    updated_date TIMESTAMPTZ DEFAULT now(),
    created_by_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    trigger_event TEXT NOT NULL,
    trigger_condition TEXT,
    action_type TEXT DEFAULT 'send_notification',
    action_config TEXT,
    application_scope TEXT,
    environment_scope TEXT DEFAULT 'all',
    enabled BOOLEAN DEFAULT true,
    last_fired TIMESTAMPTZ,
    fire_count NUMERIC DEFAULT 0,
    created_by TEXT,
    correlation_id TEXT,
    is_demo BOOLEAN DEFAULT false
  )`,

  `CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_date TIMESTAMPTZ DEFAULT now(),
    updated_date TIMESTAMPTZ DEFAULT now(),
    created_by_id TEXT,
    email TEXT NOT NULL,
    full_name TEXT,
    global_role TEXT DEFAULT 'none',
    assignments JSONB DEFAULT '[]',
    permissions JSONB DEFAULT '[]',
    token TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    invited_by TEXT,
    invited_by_email TEXT,
    expires_at TIMESTAMPTZ,
    used_at TIMESTAMPTZ,
    used_by_email TEXT,
    administrator_id TEXT,
    correlation_id TEXT
  )`,

  // Indexes
  `CREATE INDEX IF NOT EXISTS idx_app_environments_app_id ON application_environments(application_id)`,
  `CREATE INDEX IF NOT EXISTS idx_deployments_app_id ON deployments(application_id)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_events_created ON audit_events(created_date DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_events_app_id ON audit_events(application_id)`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_date DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_activity_occurred ON activity_events(occurred_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_activity_app_id ON activity_events(application_id)`,
  `CREATE INDEX IF NOT EXISTS idx_api_keys_app_id ON api_keys(application_id)`,
  `CREATE INDEX IF NOT EXISTS idx_webhooks_app_id ON webhook_configs(application_id)`,
  `CREATE INDEX IF NOT EXISTS idx_incidents_app_id ON incidents(application_id)`,
  `CREATE INDEX IF NOT EXISTS idx_incidents_created ON incidents(created_date DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_api_logs_app_id ON api_logs(application_id)`,
  `CREATE INDEX IF NOT EXISTS idx_api_logs_created ON api_logs(created_date DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_security_events_created ON security_events(created_date DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_last_active ON sessions(last_active DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_change_records_app_id ON change_records(application_id)`,
  `CREATE INDEX IF NOT EXISTS idx_app_configs_app_id ON app_configs(application_id)`,
  `CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email)`,
  `CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token)`,

  // AI Governance
  `CREATE TABLE IF NOT EXISTS ai_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_date TIMESTAMPTZ DEFAULT now(),
    updated_date TIMESTAMPTZ DEFAULT now(),
    created_by_id TEXT,
    user_id TEXT NOT NULL,
    user_email TEXT,
    request_type TEXT NOT NULL,
    prompt TEXT NOT NULL,
    data_sources JSONB DEFAULT '[]',
    response TEXT,
    proposed_action TEXT,
    approval_status TEXT DEFAULT 'none',
    execution_result TEXT,
    provider TEXT,
    model TEXT,
    correlation_id TEXT,
    latency_ms NUMERIC,
    tokens_used NUMERIC,
    error TEXT,
    application_id TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_ai_activities_created ON ai_activities(created_date DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_ai_activities_user ON ai_activities(user_id)`,

  // Branding — singleton (key='global')
  `CREATE TABLE IF NOT EXISTS branding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_date TIMESTAMPTZ DEFAULT now(),
    updated_date TIMESTAMPTZ DEFAULT now(),
    created_by_id TEXT,
    key TEXT NOT NULL UNIQUE DEFAULT 'global',
    organization_name TEXT,
    organization_description TEXT,
    logo_url TEXT,
    logo_dark_url TEXT,
    favicon_url TEXT,
    primary_color TEXT,
    updated_by TEXT
  )`,

  // Currency exchange rates — live rates fetched from a real provider
  `CREATE TABLE IF NOT EXISTS currency_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_date TIMESTAMPTZ DEFAULT now(),
    updated_date TIMESTAMPTZ DEFAULT now(),
    created_by_id TEXT,
    base_currency TEXT NOT NULL,
    rates JSONB NOT NULL,
    provider TEXT,
    fetched_at TIMESTAMPTZ DEFAULT now()
  )`,

  // Staff profiles — extended user data (photo, job title, department, etc.)
  `CREATE TABLE IF NOT EXISTS staff_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_date TIMESTAMPTZ DEFAULT now(),
    updated_date TIMESTAMPTZ DEFAULT now(),
    created_by_id TEXT,
    user_id TEXT NOT NULL UNIQUE,
    photo_url TEXT,
    job_title TEXT,
    department TEXT,
    phone TEXT,
    timezone TEXT DEFAULT 'Asia/Dubai',
    notification_prefs JSONB DEFAULT '{}'::jsonb
  )`,

  // Add base_currency to system_states
  `ALTER TABLE system_states ADD COLUMN IF NOT EXISTS base_currency TEXT DEFAULT 'USD'`,

  `CREATE INDEX IF NOT EXISTS idx_branding_key ON branding(key)`,
  `CREATE INDEX IF NOT EXISTS idx_currency_rates_base ON currency_rates(base_currency)`,
  `CREATE INDEX IF NOT EXISTS idx_currency_rates_fetched ON currency_rates(fetched_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_staff_profiles_user ON staff_profiles(user_id)`,

  // Payment providers (PSPs) — configured payment service providers
  `CREATE TABLE IF NOT EXISTS payment_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_date TIMESTAMPTZ DEFAULT now(),
    updated_date TIMESTAMPTZ DEFAULT now(),
    created_by_id TEXT,
    provider TEXT NOT NULL,
    display_name TEXT NOT NULL,
    environment TEXT DEFAULT 'production',
    status TEXT DEFAULT 'not_connected',
    capabilities JSONB DEFAULT '[]',
    supported_currencies JSONB DEFAULT '[]',
    supported_countries JSONB DEFAULT '[]',
    credential_hint TEXT,
    webhook_secret_hint TEXT,
    merchant_id TEXT,
    enabled BOOLEAN DEFAULT false,
    last_tested TIMESTAMPTZ,
    last_test_result TEXT,
    configured_by TEXT,
    correlation_id TEXT
  )`,

  // Payment links — generated payment links associated with customers/apps
  `CREATE TABLE IF NOT EXISTS payment_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_date TIMESTAMPTZ DEFAULT now(),
    updated_date TIMESTAMPTZ DEFAULT now(),
    created_by_id TEXT,
    application_id TEXT,
    application_name TEXT,
    provider TEXT NOT NULL,
    customer_email TEXT,
    customer_name TEXT,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'USD',
    description TEXT,
    reference TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    link_url TEXT,
    provider_reference TEXT,
    status TEXT DEFAULT 'pending',
    expiration TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    sent_to TEXT,
    paid_at TIMESTAMPTZ,
    correlation_id TEXT,
    created_by TEXT,
    created_by_email TEXT
  )`,

  // Staff tasks — lightweight operational follow-ups
  `CREATE TABLE IF NOT EXISTS staff_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_date TIMESTAMPTZ DEFAULT now(),
    updated_date TIMESTAMPTZ DEFAULT now(),
    created_by_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    assignee_id TEXT,
    assignee_name TEXT,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'open',
    due_date TIMESTAMPTZ,
    application_id TEXT,
    application_name TEXT,
    customer TEXT,
    payment_reference TEXT,
    notes TEXT,
    correlation_id TEXT
  )`,

  // Internal messages — staff-to-staff communication
  `CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_date TIMESTAMPTZ DEFAULT now(),
    updated_date TIMESTAMPTZ DEFAULT now(),
    created_by_id TEXT,
    conversation_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    sender_name TEXT,
    sender_email TEXT,
    sender_photo_url TEXT,
    body TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    mentions JSONB DEFAULT '[]',
    read_by JSONB DEFAULT '[]',
    correlation_id TEXT
  )`,

  // Conversations — direct messages, group chats, app channels
  `CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_date TIMESTAMPTZ DEFAULT now(),
    updated_date TIMESTAMPTZ DEFAULT now(),
    created_by_id TEXT,
    type TEXT DEFAULT 'direct',
    name TEXT,
    application_id TEXT,
    application_name TEXT,
    participants JSONB DEFAULT '[]',
    last_message TEXT,
    last_message_at TIMESTAMPTZ,
    last_sender_id TEXT,
    correlation_id TEXT
  )`,

  `CREATE INDEX IF NOT EXISTS idx_payment_providers_provider ON payment_providers(provider)`,
  `CREATE INDEX IF NOT EXISTS idx_payment_links_created ON payment_links(created_date DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_payment_links_app ON payment_links(application_id)`,
  `CREATE INDEX IF NOT EXISTS idx_staff_tasks_assignee ON staff_tasks(assignee_id)`,
  `CREATE INDEX IF NOT EXISTS idx_staff_tasks_status ON staff_tasks(status)`,
  `CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_date)`,
  `CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(participants)`,
];

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const sql = createSql();
    const results: string[] = [];
    for (const stmt of DDL) {
      await sql(stmt);
      results.push('ok');
    }

    // Verify: count tables
    const tables = await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`;
    return Response.json({
      success: true,
      statementsExecuted: DDL.length,
      tablesCreated: tables.map((t: any) => t.tablename),
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
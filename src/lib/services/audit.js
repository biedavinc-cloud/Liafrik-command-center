// Audit service. Every administrative mutation passes through recordAudit.
// In the target architecture this moves server-side (the LCP gateway writes audit events).
import { base44 } from '@/api/base44Client';
import { AuditEvents } from '@/lib/data/repositories';
import { roleOfUser } from '@/lib/rbac';
import { generateCorrelationId } from '@/lib/protocol/actions';

let cachedUser = null;
const currentUser = async () => (cachedUser ||= await base44.auth.me());

export async function recordAudit({ action, resource, resource_id, application, environment, outcome = 'success', before, after, risk_level = 'low', correlation_id }) {
  const user = await currentUser();
  const cid = correlation_id || generateCorrelationId();
  return AuditEvents.create({
    actor: user.full_name || user.email,
    actor_role: roleOfUser(user),
    application_id: application?.id,
    application_name: application?.name,
    environment: environment || application?.environment,
    action,
    resource,
    resource_id,
    outcome,
    risk_level,
    correlation_id: cid,
    ip: undefined, // populated server-side in the gateway phase
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    before: before ? JSON.stringify(before) : undefined,
    after: after ? JSON.stringify(after) : undefined,
  });
}

// Record a security event alongside the audit event
export async function recordSecurityEvent(type, severity, description, application, correlation_id) {
  const { SecurityEvents } = await import('@/lib/data/repositories');
  const user = await currentUser();
  return SecurityEvents.create({
    type,
    severity,
    actor: user.full_name || user.email,
    description,
    application_id: application?.id,
    application_name: application?.name,
    correlation_id: correlation_id || generateCorrelationId(),
    ip: undefined,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
  });
}
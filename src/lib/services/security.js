// Security service: sessions and security events.
import { Sessions, SecurityEvents } from '@/lib/data/repositories';
import { recordAudit } from './audit';

export async function revokeSession(session) {
  const updated = await Sessions.update(session.id, { status: 'revoked' });
  await recordAudit({
    action: 'session.revoked',
    resource: 'session',
    resource_id: session.id,
    application: { id: session.application_id, name: session.application_name },
    before: { status: session.status },
    after: { status: 'revoked' },
    risk_level: 'high',
  });
  return updated;
}

export async function revokeAllSessions(userId) {
  const userSessions = await Sessions.filter({ user_id: userId, status: 'active' });
  if (!userSessions.length) return;
  await Sessions.bulkUpdate(userSessions.map((s) => ({ id: s.id, status: 'revoked' })));
  await recordAudit({
    action: 'sessions.revoked_all',
    resource: 'session',
    resource_id: userId,
    risk_level: 'critical',
  });
}

export async function logSecurityEvent({ type, severity, description, application }) {
  return SecurityEvents.create({
    type,
    severity,
    description,
    application_id: application?.id,
    application_name: application?.name,
    is_demo: false,
  });
}
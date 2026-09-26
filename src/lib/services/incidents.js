// Incident management service.
import { Incidents } from '@/lib/data/repositories';
import { recordAudit } from './audit';
import { generateCorrelationId } from '@/lib/protocol/actions';

export async function createIncident(app, { title, description, severity, environment, affected_services }) {
  const cid = generateCorrelationId();
  const incident = await Incidents.create({
    application_id: app.id,
    application_name: app.name,
    title,
    description,
    severity,
    environment: environment || app.environment,
    affected_services: affected_services || [],
    status: 'open',
    correlation_id: cid,
    timeline: [{ timestamp: new Date().toISOString(), event: 'Incident created', actor: 'system' }],
    is_demo: app.is_demo || false,
  });
  await recordAudit({
    action: 'incident.created',
    resource: 'incident',
    resource_id: incident.id,
    application: app,
    after: { title, severity },
    risk_level: severity === 'critical' || severity === 'high' ? 'high' : 'medium',
    correlation_id: cid,
  });
  return incident;
}

export async function updateIncidentStatus(app, incident, status, eventLabel) {
  const timeline = [
    ...(incident.timeline || []),
    { timestamp: new Date().toISOString(), event: eventLabel || `Status changed to ${status}`, actor: 'system' },
  ];
  const patch = { status, timeline };
  if (status === 'resolved' || status === 'closed') patch.resolved_at = new Date().toISOString();
  const updated = await Incidents.update(incident.id, patch);
  await recordAudit({
    action: 'incident.status_changed',
    resource: 'incident',
    resource_id: incident.id,
    application: app,
    before: { status: incident.status },
    after: { status },
    risk_level: 'medium',
  });
  return updated;
}

export async function addTimelineEvent(incident, event, actor = 'system') {
  const timeline = [...(incident.timeline || []), { timestamp: new Date().toISOString(), event, actor }];
  return Incidents.update(incident.id, { timeline });
}
// Central Event Bus — emits formal events to the ActivityEvent store.
// Every emit also triggers rule evaluation in the automation engine.
import { Activity } from '@/lib/data/repositories';
import { eventSeverity, eventDescription } from '@/lib/protocol/event-types';
import { evaluateRules } from './rules';

export async function emit(eventType, payload = {}) {
  const severity = eventSeverity(eventType);
  const description = eventDescription(eventType);
  const correlationId = payload.correlation_id || `cc_${Date.now().toString(36)}`;

  const event = await Activity.create({
    application_id: payload.application_id || '',
    application_name: payload.application_name || '',
    message: payload.message || description,
    kind: eventType,
    event_type: eventType,
    severity,
    correlation_id: correlationId,
    actor: payload.actor || 'system',
    environment: payload.environment || '',
    occurred_at: new Date().toISOString(),
    is_demo: payload.is_demo || false,
  });

  // Fire any matching automation rules (non-blocking — failures don't break the emit)
  evaluateRules(event).catch(() => {});

  return event;
}
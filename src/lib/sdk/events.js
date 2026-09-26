/**
 * @liafrik/control-sdk/events
 *
 * Event emission and subscription.
 * Applications emit events to the Command Center; the Command Center subscribes
 * to receive them. Events use the dot-namespace convention from event-types.js.
 *
 * CONCEPTUAL — not implemented. Real implementation comes in Phase 4.
 */

export async function emit({ eventType, payload, correlationId }) {
  // POST {apiUrl}/events { event_type, payload, correlation_id }
  // The Command Center stores the event and evaluates automation rules.
  throw new Error('Not implemented — Phase 4');
}

export function subscribe(eventType, handler) {
  // Subscribe to events of a given type (for Command Center → Application events)
  // Returns an unsubscribe function.
  return () => {};
}
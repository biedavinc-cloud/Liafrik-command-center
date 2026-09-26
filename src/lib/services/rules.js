// Rule Engine — evaluates automation rules against emitted events.
// WHEN event fires → IF filters match → THEN execute action.
import { AutomationRules, Incidents, Notifications } from '@/lib/data/repositories';
import { recordAudit } from './audit';

export async function evaluateRules(event) {
  const rules = await AutomationRules.filter({ enabled: true });
  for (const rule of rules) {
    if (matchesRule(rule, event)) {
      await fireRule(rule, event);
    }
  }
}

function matchesRule(rule, event) {
  if (rule.trigger_event !== 'any' && rule.trigger_event !== event.event_type) return false;
  // Environment scope check
  if (rule.environment_scope && rule.environment_scope !== 'all' && rule.environment_scope !== event.environment) return false;
  // Additional JSON filter conditions could be parsed from rule.trigger_condition here
  return true;
}

async function fireRule(rule, event) {
  await AutomationRules.update(rule.id, {
    last_fired: new Date().toISOString(),
    fire_count: (rule.fire_count || 0) + 1,
  });

  switch (rule.action_type) {
    case 'create_incident':
      await Incidents.create({
        application_id: event.application_id,
        application_name: event.application_name,
        title: event.message,
        severity: event.severity === 'info' ? 'medium' : event.severity,
        status: 'open',
        correlation_id: event.correlation_id,
        is_demo: event.is_demo,
      });
      break;
    case 'send_notification':
      await Notifications.create({
        title: event.message,
        body: `Triggered by rule: ${rule.name}`,
        severity: event.severity === 'info' ? 'info' : event.severity,
        category: 'automation',
        application_id: event.application_id,
        is_demo: event.is_demo,
      });
      break;
    case 'lock_application':
    case 'enable_maintenance':
    case 'disable_application':
    case 'call_webhook':
    case 'rotate_key':
      // These actions require additional context and will be fully wired in Phase 4
      break;
  }

  await recordAudit({
    action: 'system.rule_fired',
    resource: 'automation_rule',
    resource_id: rule.id,
    risk_level: 'medium',
    after: { rule: rule.name, event: event.event_type, action: rule.action_type },
  });
}
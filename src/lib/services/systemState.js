// System State service — manages global Safe Mode and infrastructure status.
// Safe Mode: when active, all mutations are blocked (enforced in useAction hook).
import { SystemStates } from '@/lib/data/repositories';
import { recordAudit } from './audit';

export async function getSystemState() {
  const states = await SystemStates.filter({ key: 'global' });
  return states[0] || null;
}

export async function enableSafeMode(reason, actor) {
  const correlationId = `cc_${Date.now().toString(36)}`;
  let state = await getSystemState();
  if (!state) {
    state = await SystemStates.create({ key: 'global', safe_mode_enabled: false });
  }
  const updated = await SystemStates.update(state.id, {
    safe_mode_enabled: true,
    safe_mode_activated_by: actor,
    safe_mode_activated_at: new Date().toISOString(),
    safe_mode_reason: reason,
    safe_mode_correlation_id: correlationId,
  });
  await recordAudit({
    action: 'system.safe_mode_enabled',
    resource: 'system',
    risk_level: 'critical',
    after: { safe_mode_enabled: true, reason, actor, correlation_id: correlationId },
  });
  return updated;
}

export async function disableSafeMode(actor) {
  let state = await getSystemState();
  if (!state) return null;
  const updated = await SystemStates.update(state.id, {
    safe_mode_enabled: false,
    safe_mode_activated_by: null,
    safe_mode_activated_at: null,
    safe_mode_reason: null,
    safe_mode_correlation_id: null,
  });
  await recordAudit({
    action: 'system.safe_mode_disabled',
    resource: 'system',
    risk_level: 'critical',
    after: { safe_mode_enabled: false, actor },
  });
  return updated;
}

export async function isSafeModeActive() {
  const state = await getSystemState();
  return state?.safe_mode_enabled || false;
}
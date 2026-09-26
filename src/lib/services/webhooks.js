// Webhook management service.
import { Webhooks } from '@/lib/data/repositories';
import { recordAudit } from './audit';

export async function createWebhook(app, { event, endpoint }) {
  const secretHint = `whsec_••••${Math.random().toString(16).slice(2, 6)}`;
  const hook = await Webhooks.create({
    application_id: app.id,
    application_name: app.name,
    event,
    endpoint,
    status: 'active',
    secret_hint: secretHint,
    is_demo: app.is_demo || false,
  });
  await recordAudit({
    action: 'webhook.created',
    resource: 'webhook',
    resource_id: hook.id,
    application: app,
    after: { event, endpoint },
    risk_level: 'medium',
  });
  return hook;
}

export async function toggleWebhook(app, hook, enabled) {
  const updated = await Webhooks.update(hook.id, { status: enabled ? 'active' : 'disabled' });
  await recordAudit({
    action: `webhook.${enabled ? 'enabled' : 'disabled'}`,
    resource: 'webhook',
    resource_id: hook.id,
    application: app,
    before: { status: hook.status },
    after: { status: enabled ? 'active' : 'disabled' },
    risk_level: 'medium',
  });
  return updated;
}

export async function deleteWebhook(app, hook) {
  await Webhooks.remove(hook.id);
  await recordAudit({
    action: 'webhook.deleted',
    resource: 'webhook',
    resource_id: hook.id,
    application: app,
    before: { event: hook.event, endpoint: hook.endpoint },
    risk_level: 'medium',
  });
}

export async function retryWebhook(app, hook) {
  // In the real system, this triggers a server-side retry of the last failed delivery.
  await recordAudit({
    action: 'webhook.retried',
    resource: 'webhook',
    resource_id: hook.id,
    application: app,
    risk_level: 'low',
  });
}
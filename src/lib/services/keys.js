// API key management service. Secrets are never displayed after creation — only a masked hint.
import { ApiKeys } from '@/lib/data/repositories';
import { recordAudit } from './audit';

export async function createApiKey(app, { name, environment, scopes }) {
  // Generate a masked hint — the real key is provisioned server-side in the credential vault.
  const hint = `lcc_••••${Math.random().toString(16).slice(2, 6)}`;
  const key = await ApiKeys.create({
    application_id: app.id,
    application_name: app.name,
    name,
    environment,
    key_hint: hint,
    scopes: scopes || [],
    status: 'active',
    is_demo: app.is_demo || false,
  });
  await recordAudit({
    action: 'api_key.created',
    resource: 'api_key',
    resource_id: key.id,
    application: app,
    after: { name, environment, scopes },
    risk_level: 'medium',
  });
  return key;
}

export async function rotateApiKey(app, key) {
  const hint = `lcc_••••${Math.random().toString(16).slice(2, 6)}`;
  const updated = await ApiKeys.update(key.id, {
    key_hint: hint,
    rotated_at: new Date().toISOString(),
    status: 'active',
  });
  await recordAudit({
    action: 'api_key.rotated',
    resource: 'api_key',
    resource_id: key.id,
    application: app,
    before: { key_hint: key.key_hint },
    after: { key_hint: hint },
    risk_level: 'high',
  });
  return updated;
}

export async function revokeApiKey(app, key) {
  const updated = await ApiKeys.update(key.id, {
    status: 'revoked',
    revoked_at: new Date().toISOString(),
  });
  await recordAudit({
    action: 'api_key.revoked',
    resource: 'api_key',
    resource_id: key.id,
    application: app,
    before: { status: key.status },
    after: { status: 'revoked' },
    risk_level: 'critical',
  });
  return updated;
}

export async function disableApiKey(app, key) {
  const updated = await ApiKeys.update(key.id, { status: 'disabled' });
  await recordAudit({
    action: 'api_key.disabled',
    resource: 'api_key',
    resource_id: key.id,
    application: app,
    before: { status: key.status },
    after: { status: 'disabled' },
    risk_level: 'medium',
  });
  return updated;
}
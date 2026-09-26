// Configuration Management — feature flags, settings, and integration config.
// Secrets are never stored in plaintext — only a "••••configured" hint is persisted.
import { AppConfigs, ChangeRecords } from '@/lib/data/repositories';
import { recordAudit } from './audit';

export async function getConfigs(appId, env = 'production') {
  return AppConfigs.filter({ application_id: appId, environment: env }, 'section');
}

export async function setConfig(app, env, key, value, section, valueType = 'string', actor = 'system') {
  const existing = await AppConfigs.filter({ application_id: app.id, environment: env, key });
  const correlationId = `cc_${Date.now().toString(36)}`;
  const isSecret = valueType === 'secret';
  const storedValue = isSecret ? '••••configured' : String(value);

  if (existing.length > 0) {
    const config = existing[0];
    const before = config.value;
    const updated = await AppConfigs.update(config.id, {
      value: storedValue,
      value_type: valueType,
      is_secret: isSecret,
      is_configured: true,
      last_changed_by: actor,
      last_changed_at: new Date().toISOString(),
      correlation_id: correlationId,
    });
    await ChangeRecords.create({
      application_id: app.id,
      application_name: app.name,
      field: `config.${key}`,
      before: isSecret ? '••••' : before,
      after: storedValue,
      changed_by: actor,
      section: 'configuration',
      is_demo: app.is_demo,
    });
    await recordAudit({
      action: 'application.config_changed',
      resource: 'app_config',
      resource_id: config.id,
      application: app,
      before: { key, value: isSecret ? '••••' : before },
      after: { key, value: storedValue },
      risk_level: 'medium',
    });
    return updated;
  }

  const config = await AppConfigs.create({
    application_id: app.id,
    application_name: app.name,
    environment: env,
    section,
    key,
    value: storedValue,
    value_type: valueType,
    is_secret: isSecret,
    is_configured: true,
    last_changed_by: actor,
    last_changed_at: new Date().toISOString(),
    correlation_id: correlationId,
    is_demo: app.is_demo,
  });
  await recordAudit({
    action: 'application.config_created',
    resource: 'app_config',
    resource_id: config.id,
    application: app,
    after: { key, section, value_type: valueType },
    risk_level: 'medium',
  });
  return config;
}

export async function deleteConfig(app, configId) {
  const config = await AppConfigs.get(configId);
  await AppConfigs.remove(configId);
  await recordAudit({
    action: 'application.config_deleted',
    resource: 'app_config',
    resource_id: configId,
    application: app,
    before: { key: config?.key, section: config?.section },
    risk_level: 'medium',
  });
}
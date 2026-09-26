import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { neonRepo } from '../../shared/neonRepo.ts';
import { PSP_PROVIDERS, isPSPSecretSet, getSecretHint, makeHint } from '../../shared/pspGateway.ts';

// PSP management — list, connect, disconnect, toggle, test.
// Credentials are stored as server-side secrets (Settings → Secrets).
// Only masked hints are stored in the database.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const operation = body.operation || 'list';
    const repo = neonRepo('PaymentProvider');
    const auditRepo = neonRepo('AuditEvent');

    if (operation === 'list') {
      const stored = await repo.list('provider');
      const storedMap: Record<string, any> = {};
      for (const s of stored) storedMap[s.provider] = s;

      const result = [];
      for (const [key, def] of Object.entries(PSP_PROVIDERS)) {
        const config = storedMap[key];
        const platformSecretSet = isPSPSecretSet(key);
        const dbSecretSet = !!(config?.secret_value);
        const secretSet = platformSecretSet || dbSecretSet;
        const hint = config?.credential_hint || (dbSecretSet ? makeHint(config.secret_value) : (platformSecretSet ? getSecretHint(key) : null));
        result.push({
          ...def,
          id: config?.id,
          status: config?.status || (secretSet ? 'configured' : 'not_connected'),
          enabled: config?.enabled || false,
          environment: config?.environment || 'production',
          credential_hint: hint,
          merchant_id: config?.merchant_id,
          last_tested: config?.last_tested,
          last_test_result: config?.last_test_result,
          secret_configured: secretSet,
        });
      }
      return Response.json(result);
    }

    if (operation === 'configure') {
      const { provider, secret_value, webhook_secret_value, site_id_value, environment } = body;
      const def = PSP_PROVIDERS[provider];
      if (!def) return Response.json({ error: 'Unknown provider' }, { status: 400 });
      if (!secret_value || secret_value.length < 6) return Response.json({ error: 'API key must be at least 6 characters' }, { status: 400 });

      const env = environment || 'production';
      const existing = await repo.filter({ provider, environment: env });
      const hint = makeHint(secret_value);

      const updateData: any = {
        credential_hint: hint,
        configured_by: user.email,
        secret_value,
      };
      if (webhook_secret_value !== undefined) updateData.webhook_secret_value = webhook_secret_value;
      if (site_id_value !== undefined) updateData.site_id_value = site_id_value;

      let result;
      if (existing[0]) {
        result = await repo.update(existing[0].id, updateData);
      } else {
        result = await repo.create({
          provider, display_name: def.display_name, environment: env,
          status: 'configured', enabled: false,
          capabilities: def.capabilities, supported_currencies: def.supported_currencies,
          supported_countries: def.supported_countries,
          correlation_id: `psp_${Date.now()}`,
          ...updateData,
        });
      }

      await auditRepo.create({
        actor: user.email, actor_role: user.role, action: 'psp.configure',
        resource: 'payment_provider', resource_id: result.id,
        outcome: 'success', risk_level: 'high', correlation_id: `psp_${Date.now()}`,
        after: `provider=${provider} hint=${hint}`,
      });
      return Response.json({ success: true, credential_hint: hint });
    }

    if (operation === 'connect') {
      const { provider, environment, merchant_id } = body;
      const def = PSP_PROVIDERS[provider];
      if (!def) return Response.json({ error: 'Unknown provider' }, { status: 400 });

      const env = environment || 'production';
      const existing = await repo.filter({ provider, environment: env });
      const dbSecret = existing[0]?.secret_value;
      const dbSecretSet = !!dbSecret;
      if (!isPSPSecretSet(provider) && !dbSecretSet) return Response.json({
        error: `Secret ${def.secret_key_env} is not configured. Configure it in the PSP Center, then connect.`,
      }, { status: 400 });

      const hint = dbSecret ? makeHint(dbSecret) : getSecretHint(provider);

      let result;
      if (existing[0]) {
        result = await repo.update(existing[0].id, {
          status: 'connected', enabled: true, merchant_id,
          credential_hint: hint, configured_by: user.email,
        });
      } else {
        result = await repo.create({
          provider, display_name: def.display_name, environment: env,
          status: 'connected', enabled: true,
          capabilities: def.capabilities, supported_currencies: def.supported_currencies,
          supported_countries: def.supported_countries,
          merchant_id, credential_hint: hint, configured_by: user.email,
          correlation_id: `psp_${Date.now()}`,
        });
      }

      await auditRepo.create({
        actor: user.email, actor_role: user.role, action: 'psp.connect',
        resource: 'payment_provider', resource_id: result.id,
        outcome: 'success', risk_level: 'high', correlation_id: `psp_${Date.now()}`,
      });
      // Never expose secret values in the response
      const { secret_value, webhook_secret_value, site_id_value, ...safeResult } = result;
      return Response.json(safeResult);
    }

    if (operation === 'disconnect') {
      const { provider, environment } = body;
      const existing = await repo.filter({ provider, environment: environment || 'production' });
      if (existing[0]) {
        await repo.update(existing[0].id, { status: 'not_connected', enabled: false });
      }
      await auditRepo.create({
        actor: user.email, actor_role: user.role, action: 'psp.disconnect',
        resource: 'payment_provider', resource_id: existing[0]?.id,
        outcome: 'success', risk_level: 'high', correlation_id: `psp_${Date.now()}`,
      });
      return Response.json({ success: true });
    }

    if (operation === 'toggle') {
      const { provider, environment, enabled } = body;
      const existing = await repo.filter({ provider, environment: environment || 'production' });
      if (existing[0]) await repo.update(existing[0].id, { enabled });
      return Response.json({ success: true });
    }

    if (operation === 'test') {
      const { provider } = body;
      const def = PSP_PROVIDERS[provider];
      if (!def) return Response.json({ error: 'Unknown provider' }, { status: 400 });
      const existing = await repo.filter({ provider });
      const dbSecretSet = !!(existing[0]?.secret_value);
      const secretSet = isPSPSecretSet(provider) || dbSecretSet;
      const result = {
        provider, secret_configured: secretSet,
        status: secretSet ? 'passed' : 'failed',
        message: secretSet ? 'API key is configured' : `Secret ${def.secret_key_env} is not set`,
      };
      if (existing[0]) {
        await repo.update(existing[0].id, {
          last_tested: new Date().toISOString(),
          last_test_result: secretSet ? 'passed' : 'failed',
        });
      }
      return Response.json(result);
    }

    return Response.json({ error: 'Unknown operation' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
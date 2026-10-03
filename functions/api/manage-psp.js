import { createPlatform, isSafeModeActive } from "../_shared/platform.js";
import { neonRepo } from "../_shared/neonRepo.js";
import { PSP_PROVIDERS, LINK_CREATION_SUPPORTED, isPSPSecretSet, getSecretHint, makeHint, verifyPSPCredentials } from "../_shared/pspGateway.js";
async function onRequestPost({ request: req, env }) {
  try {
    const platform = createPlatform(req, env);
    const user = await platform.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const operation = body.operation || "list";
    if (["configure", "connect", "disconnect", "toggle"].includes(operation) && await isSafeModeActive(env)) {
      return Response.json({ error: "Safe Mode is active. All mutations are disabled." }, { status: 423 });
    }
    const repo = neonRepo("PaymentProvider");
    const auditRepo = neonRepo("AuditEvent");
    if (operation === "list") {
      const stored = await repo.list("provider");
      const storedMap = {};
      for (const s of stored) storedMap[s.provider] = s;
      const result = [];
      for (const [key, def] of Object.entries(PSP_PROVIDERS)) {
        const config = storedMap[key];
        const platformSecretSet = isPSPSecretSet(key);
        const dbSecretSet = !!config?.secret_value;
        const secretSet = platformSecretSet || dbSecretSet;
        const hint = config?.credential_hint || (dbSecretSet ? makeHint(config.secret_value) : platformSecretSet ? getSecretHint(key) : null);
        result.push({
          ...def,
          id: config?.id,
          status: config?.status || (secretSet ? "configured" : "not_connected"),
          enabled: config?.enabled || false,
          environment: config?.environment || "production",
          credential_hint: hint,
          merchant_id: config?.merchant_id,
          last_tested: config?.last_tested,
          last_test_result: config?.last_test_result,
          secret_configured: secretSet,
          link_creation_supported: LINK_CREATION_SUPPORTED.has(key)
        });
      }
      return Response.json(result);
    }
    if (operation === "configure") {
      const { provider, secret_value, webhook_secret_value, site_id_value, merchant_id, api_password_value, environment } = body;
      const def = PSP_PROVIDERS[provider];
      if (!def) return Response.json({ error: "Unknown provider" }, { status: 400 });
      if (!secret_value || secret_value.length < 6) return Response.json({ error: "API key must be at least 6 characters" }, { status: 400 });
      const env2 = environment || "production";
      const existing = await repo.filter({ provider, environment: env2 });
      const hint = makeHint(secret_value);
      const updateData = {
        credential_hint: hint,
        configured_by: user.email,
        secret_value,
        status: "configured",
        enabled: false
      };
      if (webhook_secret_value !== void 0) updateData.webhook_secret_value = webhook_secret_value;
      if (site_id_value !== void 0) updateData.site_id_value = site_id_value;
      if (merchant_id !== void 0) updateData.merchant_id = merchant_id;
      if (api_password_value !== void 0) {
        updateData.api_password_value = api_password_value;
        updateData.api_password_hint = makeHint(api_password_value);
      }
      let result;
      if (existing[0]) {
        result = await repo.update(existing[0].id, updateData);
      } else {
        result = await repo.create({
          provider,
          display_name: def.display_name,
          environment: env2,
          status: "configured",
          enabled: false,
          capabilities: def.capabilities,
          supported_currencies: def.supported_currencies,
          supported_countries: def.supported_countries,
          correlation_id: `psp_${Date.now()}`,
          ...updateData
        });
      }
      await auditRepo.create({
        actor: user.email,
        actor_role: user.role,
        action: "psp.configure",
        resource: "payment_provider",
        resource_id: result.id,
        outcome: "success",
        risk_level: "high",
        correlation_id: `psp_${Date.now()}`,
        after: `provider=${provider} hint=${hint}`
      });
      return Response.json({ success: true, credential_hint: hint });
    }
    if (operation === "connect") {
      const { provider, environment, merchant_id } = body;
      const def = PSP_PROVIDERS[provider];
      if (!def) return Response.json({ error: "Unknown provider" }, { status: 400 });
      const env2 = environment || "production";
      const existing = await repo.filter({ provider, environment: env2 });
      const dbSecret = existing[0]?.secret_value;
      const dbSecretSet = !!dbSecret;
      if (!isPSPSecretSet(provider) && !dbSecretSet) return Response.json({
        error: `Secret ${def.secret_key_env} is not configured. Configure it in the PSP Center, then connect.`
      }, { status: 400 });
      const secretKey = dbSecret || (isPSPSecretSet(provider) ? env[def.secret_key_env] : null);
      const verification = secretKey ? await verifyPSPCredentials(provider, secretKey) : { verified: null };
      if (verification.verified === false) return Response.json({ error: verification.error }, { status: 400 });
      const hint = dbSecret ? makeHint(dbSecret) : getSecretHint(provider);
      let result;
      if (existing[0]) {
        result = await repo.update(existing[0].id, {
          status: "connected",
          enabled: true,
          merchant_id,
          credential_hint: hint,
          configured_by: user.email
        });
      } else {
        result = await repo.create({
          provider,
          display_name: def.display_name,
          environment: env2,
          status: "connected",
          enabled: true,
          capabilities: def.capabilities,
          supported_currencies: def.supported_currencies,
          supported_countries: def.supported_countries,
          merchant_id,
          credential_hint: hint,
          configured_by: user.email,
          correlation_id: `psp_${Date.now()}`
        });
      }
      await auditRepo.create({
        actor: user.email,
        actor_role: user.role,
        action: "psp.connect",
        resource: "payment_provider",
        resource_id: result.id,
        outcome: "success",
        risk_level: "high",
        correlation_id: `psp_${Date.now()}`
      });
      const { secret_value, webhook_secret_value, site_id_value, ...safeResult } = result;
      return Response.json(safeResult);
    }
    if (operation === "disconnect") {
      const { provider, environment } = body;
      const existing = await repo.filter({ provider, environment: environment || "production" });
      if (existing[0]) {
        await repo.update(existing[0].id, { status: "not_connected", enabled: false });
      }
      await auditRepo.create({
        actor: user.email,
        actor_role: user.role,
        action: "psp.disconnect",
        resource: "payment_provider",
        resource_id: existing[0]?.id,
        outcome: "success",
        risk_level: "high",
        correlation_id: `psp_${Date.now()}`
      });
      return Response.json({ success: true });
    }
    if (operation === "toggle") {
      const { provider, environment, enabled } = body;
      const existing = await repo.filter({ provider, environment: environment || "production" });
      if (existing[0]) await repo.update(existing[0].id, { enabled });
      await auditRepo.create({
        actor: user.email,
        actor_role: user.role,
        action: enabled ? "psp.enable" : "psp.disable",
        resource: "payment_provider",
        resource_id: existing[0]?.id,
        outcome: "success",
        risk_level: "medium",
        correlation_id: `psp_${Date.now()}`
      });
      return Response.json({ success: true });
    }
    if (operation === "test") {
      const { provider, environment } = body;
      const def = PSP_PROVIDERS[provider];
      if (!def) return Response.json({ error: "Unknown provider" }, { status: 400 });
      const existing = await repo.filter({ provider, environment: environment || "production" });
      const dbSecret = existing[0]?.secret_value;
      const dbSecretSet = !!dbSecret;
      const secretSet = isPSPSecretSet(provider) || dbSecretSet;
      let result;
      if (!secretSet) {
        result = { provider, secret_configured: false, status: "failed", message: `Secret ${def.secret_key_env} is not set` };
      } else {
        const secretKey = dbSecret || env[def.secret_key_env];
        const verification = await verifyPSPCredentials(provider, secretKey);
        result = verification.verified === false
          ? { provider, secret_configured: true, status: "failed", message: verification.error }
          : verification.verified === true
            ? { provider, secret_configured: true, status: "passed", message: "Credentials verified with the provider" }
            : { provider, secret_configured: true, status: "passed", message: "API key is configured (no live verification endpoint for this provider)" };
      }
      if (existing[0]) {
        await repo.update(existing[0].id, {
          last_tested: (/* @__PURE__ */ new Date()).toISOString(),
          last_test_result: result.status
        });
      }
      return Response.json(result);
    }
    return Response.json({ error: "Unknown operation" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
export {
  onRequestPost
};

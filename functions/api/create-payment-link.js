import { createPlatform, isSafeModeActive } from "../_shared/platform.js";
import { neonRepo } from "../_shared/neonRepo.js";
import { createPaymentLink as pspCreateLink, getPSPProvider, getPSPSecretFromDB } from "../_shared/pspGateway.js";
async function onRequestPost({ request: req, env }) {
  try {
    const platform = createPlatform(req, env);
    const user = await platform.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });
    if (await isSafeModeActive(env)) return Response.json({ error: "Safe Mode is active. All mutations are disabled." }, { status: 423 });
    const body = await req.json().catch(() => ({}));
    const {
      provider,
      application_id,
      application_name,
      customer_email,
      customer_name,
      amount,
      currency,
      description,
      reference,
      metadata,
      expiration
    } = body;
    if (!provider || !amount || !currency) return Response.json({ error: "Missing required fields" }, { status: 400 });
    if (!customer_email) return Response.json({ error: "Customer email is required" }, { status: 400 });
    const def = getPSPProvider(provider);
    if (!def) return Response.json({ error: "Unknown PSP provider" }, { status: 400 });
    const pspRepo = neonRepo("PaymentProvider");
    const { secretKey, siteId, apiUsername, apiPassword } = await getPSPSecretFromDB(provider, pspRepo);
    if (!secretKey) return Response.json({ error: `${def.secret_key_env} is not configured. Configure it in the PSP Center.` }, { status: 400 });
    const correlationId = `paylink_${Date.now()}`;
    let linkResult;
    try {
      linkResult = await pspCreateLink(provider, {
        amount: Number(amount),
        currency,
        description: description || "Payment",
        customer_email,
        customer_name,
        reference: reference || correlationId,
        metadata
      }, { secretKey, siteId, apiUsername, apiPassword });
    } catch (e) {
      const auditRepo2 = neonRepo("AuditEvent");
      await auditRepo2.create({
        actor: user.email,
        actor_role: user.role,
        action: "payment_link.create_failed",
        resource: "payment_link",
        outcome: "failure",
        risk_level: "high",
        correlation_id: correlationId,
        after: e.message
      });
      return Response.json({ error: e.message, correlation_id: correlationId }, { status: 400 });
    }
    const repo = neonRepo("PaymentLink");
    const record = await repo.create({
      application_id,
      application_name,
      provider,
      customer_email,
      customer_name,
      amount: Number(amount),
      currency,
      description,
      reference: reference || correlationId,
      metadata: metadata || {},
      link_url: linkResult.link_url,
      provider_reference: linkResult.provider_reference,
      status: "pending",
      expiration: expiration || null,
      correlation_id: correlationId,
      created_by: user.email,
      created_by_email: user.email
    });
    const auditRepo = neonRepo("AuditEvent");
    await auditRepo.create({
      actor: user.email,
      actor_role: user.role,
      action: "payment_link.create",
      resource: "payment_link",
      resource_id: record.id,
      outcome: "success",
      risk_level: "high",
      correlation_id: correlationId,
      after: `${provider} ${amount} ${currency} \u2192 ${customer_email}`
    });
    return Response.json(record);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
export {
  onRequestPost
};

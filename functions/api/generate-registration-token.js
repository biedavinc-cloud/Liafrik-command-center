import { createPlatform } from "../_shared/platform.js";
import { neonRepo } from "../_shared/neonRepo.js";
async function generateRegistrationToken_default(req) {
  try {
    const platform = createPlatform(req, env);
    const user = await platform.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden \u2014 admin only" }, { status: 403 });
    const body = await req.json();
    const { application_id, environment = "production" } = body;
    if (!application_id) return Response.json({ error: "application_id is required" }, { status: 400 });
    const rawUuid = crypto.randomUUID().replace(/-/g, "");
    const token = `lcp_${rawUuid}`;
    const tokenHint = `${token.slice(0, 10)}\u2022\u2022\u2022\u2022${token.slice(-4)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1e3).toISOString();
    await neonRepo("Application").update(application_id, {
      registration_token_hint: tokenHint,
      registration_status: "active"
    });
    await neonRepo("AuditEvent").create({
      actor: user.email,
      actor_role: user.role,
      application_id,
      action: "application.registration_token_generated",
      resource: "application",
      resource_id: application_id,
      outcome: "success",
      risk_level: "high",
      after: JSON.stringify({ token_hint: tokenHint, expires_at: expiresAt, environment })
    });
    return Response.json({
      token,
      token_hint: tokenHint,
      expires_at: expiresAt,
      environment,
      message: "This token will only be shown once. Store it securely."
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
export {
  generateRegistrationToken_default as default
};

import { createPlatform, isSafeModeActive } from "../_shared/platform.js";
import { neonRepo } from "../_shared/neonRepo.js";
export async function onRequestPost({ request: req, env }) {
  try {
    const platform = createPlatform(req, env);
    const user = await platform.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden \u2014 admin only" }, { status: 403 });
    if (await isSafeModeActive(env)) return Response.json({ error: "Safe Mode is active. All mutations are disabled." }, { status: 423 });
    const body = await req.json();
    const { application_id, environment = "production" } = body;
    if (!application_id) return Response.json({ error: "application_id is required" }, { status: 400 });
    const rawUuid = crypto.randomUUID().replace(/-/g, "");
    const token = `lcp_${rawUuid}`;
    const tokenHint = `${token.slice(0, 10)}\u2022\u2022\u2022\u2022${token.slice(-4)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1e3).toISOString();
    const hashBuf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
    const apiSecretHash = [...new Uint8Array(hashBuf)].map((b) => b.toString(16).padStart(2, "0")).join("");
    await neonRepo("Application").update(application_id, {
      registration_token_hint: tokenHint,
      registration_status: "active",
      api_secret_hash: apiSecretHash
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

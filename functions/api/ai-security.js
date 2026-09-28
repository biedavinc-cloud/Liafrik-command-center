import { createPlatform } from "../_shared/platform.js";
import { invokeAI, SYSTEM_PROMPT_SECURITY } from "../_shared/aiGateway.js";
import { getSecuritySnapshot } from "../_shared/aiTools.js";
import { neonRepo } from "../_shared/neonRepo.js";
async function onRequestPost({ request: req, env }) {
  try {
    const platform = createPlatform(req, env);
    const user = await platform.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden: admin required" }, { status: 403 });
    const correlationId = `ai_sec_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const startTime = Date.now();
    const snapshot = await getSecuritySnapshot();
    const dataSources = ["securityEvents", "activeSessions", "failedAuditEvents", "administrators", "apiKeys"];
    const contextData = JSON.stringify(snapshot, null, 2);
    const fullPrompt = `Perform a security analysis of the system.

VERIFIED SECURITY DATA (JSON):
${contextData}

Analyze for:
1. Suspicious authentication activity (failed logins, unusual locations)
2. Unusual administrator behavior (privilege changes, off-hours access)
3. Excessive permissions (admins with broad scope, unused API keys)
4. API key or security event patterns
5. Repeated failed requests or access attempts
6. Abnormal access patterns (unusual devices, browsers, locations)

For each finding, clearly label as VERIFIED DATA, AI ANALYSIS, RECOMMENDATION, or UNKNOWN.
All security decisions remain human-controlled. Do not propose auto-blocking or auto-suspension.`;
    const result = await invokeAI(fullPrompt, SYSTEM_PROMPT_SECURITY, {
      userId: user.id,
      correlationId,
      dataSources,
      opts: { temperature: 0.3, maxTokens: 4096 }
    });
    const latencyMs = Date.now() - startTime;
    await neonRepo("AiActivity").create({
      user_id: user.id,
      user_email: user.email,
      request_type: "security",
      prompt: "Security copilot analysis".slice(0, 5e3),
      data_sources: dataSources,
      response: result.text?.slice(0, 1e4) || "",
      provider: result.provider,
      model: result.model,
      correlation_id: correlationId,
      latency_ms: latencyMs,
      tokens_used: result.tokensUsed || 0,
      error: result.error || null
    });
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
export {
  onRequestPost
};

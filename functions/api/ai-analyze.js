import { createPlatform } from "../_shared/platform.js";
import { invokeAI, SYSTEM_PROMPT_OPS } from "../_shared/aiGateway.js";
import { getOpsSnapshot } from "../_shared/aiTools.js";
import { neonRepo } from "../_shared/neonRepo.js";
async function onRequestPost({ request: req, env }) {
  try {
    const platform = createPlatform(req, env);
    const user = await platform.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden: admin required" }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const { applicationId, focus } = body;
    const correlationId = `ai_ops_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const startTime = Date.now();
    const snapshot = await getOpsSnapshot();
    const dataSources = ["opsSnapshot", "apiErrorRates", "webhookHealth", "deployments", "incidents", "auditEvents"];
    const contextData = JSON.stringify(snapshot, null, 2);
    const focusInstruction = focus ? `Focus your analysis on: ${focus}.` : applicationId ? "Focus your analysis on the specified application." : "Analyze the entire ecosystem.";
    const fullPrompt = `Perform an AIOps analysis of the system. ${focusInstruction}

VERIFIED OPERATIONAL DATA (JSON):
${contextData}

Identify:
1. Unusual error rates or error patterns
2. Abnormal traffic or activity spikes
3. API or webhook failures
4. Health degradation
5. Performance anomalies (latency, response times)
6. Incidents that may correlate with recent deployments
7. Any abnormal application behavior

For each finding, clearly label it as VERIFIED DATA, AI ANALYSIS, RECOMMENDATION, or UNKNOWN. Prioritize by severity.`;
    const result = await invokeAI(fullPrompt, SYSTEM_PROMPT_OPS, {
      userId: user.id,
      correlationId,
      dataSources,
      opts: { temperature: 0.3, maxTokens: 4096 }
    });
    const latencyMs = Date.now() - startTime;
    await neonRepo("AiActivity").create({
      user_id: user.id,
      user_email: user.email,
      request_type: "analyze",
      prompt: (focus || "Full ecosystem AIOps analysis").slice(0, 5e3),
      data_sources: dataSources,
      response: result.text?.slice(0, 1e4) || "",
      provider: result.provider,
      model: result.model,
      correlation_id: correlationId,
      latency_ms: latencyMs,
      tokens_used: result.tokensUsed || 0,
      error: result.error || null,
      application_id: applicationId || null
    });
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
export {
  onRequestPost
};

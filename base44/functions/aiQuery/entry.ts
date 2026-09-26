import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { invokeAI, SYSTEM_PROMPT_GENERAL } from '../../shared/aiGateway.ts';
import { getSystemOverview, getApplications, getIncidents, getAuditEvents, searchPlatform } from '../../shared/aiTools.ts';
import { neonRepo } from '../../shared/neonRepo.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden: admin required' }, { status: 403 });

    const body = await req.json();
    const { prompt, applicationId } = body;
    if (!prompt?.trim()) return Response.json({ error: 'Prompt is required' }, { status: 400 });

    const correlationId = `ai_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const startTime = Date.now();

    // Gather verified data
    const dataSources = ['systemOverview', 'applications', 'incidents', 'auditEvents', 'search'];
    const [overview, apps, incidents, audit, search] = await Promise.all([
      getSystemOverview(),
      getApplications(),
      getIncidents(),
      getAuditEvents(50),
      searchPlatform(prompt),
    ]);

    const contextData = JSON.stringify({
      overview,
      applications: apps,
      openIncidents: incidents,
      recentAuditEvents: audit,
      searchResults: search,
      ...(applicationId ? { focusedApplicationId: applicationId } : {}),
    }, null, 2);

    const fullPrompt = `USER QUESTION: ${prompt}

VERIFIED SYSTEM DATA (JSON):
${contextData}

Answer the user's question using ONLY the verified data above. Follow the formatting rules in the system prompt. If the question is about a specific application, focus on that application's data.`;

    const result = await invokeAI(fullPrompt, SYSTEM_PROMPT_GENERAL, {
      userId: user.id,
      correlationId,
      dataSources,
      opts: { temperature: 0.3, maxTokens: 4096 },
    });

    const latencyMs = Date.now() - startTime;

    // Governance log
    await neonRepo('AiActivity').create({
      user_id: user.id,
      user_email: user.email,
      request_type: 'query',
      prompt: prompt.slice(0, 5000),
      data_sources: dataSources,
      response: result.text?.slice(0, 10000) || '',
      provider: result.provider,
      model: result.model,
      correlation_id: correlationId,
      latency_ms: latencyMs,
      tokens_used: result.tokensUsed || 0,
      error: result.error || null,
      application_id: applicationId || null,
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
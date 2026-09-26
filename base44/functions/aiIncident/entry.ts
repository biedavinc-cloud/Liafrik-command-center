import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { invokeAI, SYSTEM_PROMPT_INCIDENT } from '../../shared/aiGateway.ts';
import { getIncidentContext } from '../../shared/aiTools.ts';
import { neonRepo } from '../../shared/neonRepo.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden: admin required' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { incidentId } = body;
    if (!incidentId) return Response.json({ error: 'incidentId is required' }, { status: 400 });

    const correlationId = `ai_inc_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const startTime = Date.now();

    const incidentContext = await getIncidentContext(incidentId);
    if (!incidentContext) return Response.json({ error: 'Incident not found' }, { status: 404 });

    const dataSources = ['incident', 'application', 'deployments', 'apiLogs', 'auditEvents', 'activity', 'configChanges', 'configs'];
    const contextData = JSON.stringify(incidentContext, null, 2);

    const fullPrompt = `Analyze the following incident and provide a comprehensive incident commander report.

VERIFIED INCIDENT DATA (JSON):
${contextData}

Provide your analysis following the incident commander format:
- INCIDENT SUMMARY
- AFFECTED SCOPE
- TIMELINE
- RELATED CHANGES (deployments, config changes)
- POSSIBLE CONTRIBUTING FACTORS
- SUGGESTED REMEDIATION
- CONFIDENCE LEVEL (High/Medium/Low)
- EVIDENCE USED

All remediation steps are recommendations only — humans execute all actions.`;

    const result = await invokeAI(fullPrompt, SYSTEM_PROMPT_INCIDENT, {
      userId: user.id,
      correlationId,
      dataSources,
      opts: { temperature: 0.3, maxTokens: 4096 },
    });

    const latencyMs = Date.now() - startTime;

    await neonRepo('AiActivity').create({
      user_id: user.id,
      user_email: user.email,
      request_type: 'incident',
      prompt: `Incident analysis: ${incidentContext.incident?.title || incidentId}`.slice(0, 5000),
      data_sources: dataSources,
      response: result.text?.slice(0, 10000) || '',
      provider: result.provider,
      model: result.model,
      correlation_id: correlationId,
      latency_ms: latencyMs,
      tokens_used: result.tokensUsed || 0,
      error: result.error || null,
      application_id: incidentContext.incident?.application_id || null,
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { invokeAI, SYSTEM_PROMPT_ONBOARD } from '../../shared/aiGateway.ts';
import { getOnboardingData } from '../../shared/aiTools.ts';
import { neonRepo } from '../../shared/neonRepo.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden: admin required' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { applicationId } = body;
    if (!applicationId) return Response.json({ error: 'applicationId is required' }, { status: 400 });

    const correlationId = `ai_ob_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const startTime = Date.now();

    const onboardingData = await getOnboardingData(applicationId);
    if (!onboardingData) return Response.json({ error: 'Application not found' }, { status: 404 });

    const dataSources = ['application', 'environments', 'configs', 'apiKeys', 'webhooks'];
    const contextData = JSON.stringify(onboardingData, null, 2);

    const fullPrompt = `Analyze the following application's onboarding declaration and generate a technical summary.

VERIFIED APPLICATION DATA (JSON):
${contextData}

Provide your analysis following the onboarding format:
- CAPABILITIES — what the application can do (from declared data)
- AVAILABLE ACTIONS — operations the control plane can perform
- REQUIRED PERMISSIONS — what the application needs
- COMPATIBILITY — any compatibility issues with the control protocol
- SECURITY CONCERNS — any flags from the declared configuration
- TECHNICAL SUMMARY — one-paragraph overview

Clearly distinguish between what the application declares and what it actually does. Flag any missing or incomplete declarations as UNKNOWN.`;

    const result = await invokeAI(fullPrompt, SYSTEM_PROMPT_ONBOARD, {
      userId: user.id,
      correlationId,
      dataSources,
      opts: { temperature: 0.3, maxTokens: 4096 },
    });

    const latencyMs = Date.now() - startTime;

    await neonRepo('AiActivity').create({
      user_id: user.id,
      user_email: user.email,
      request_type: 'onboard',
      prompt: `Onboarding analysis: ${onboardingData.application?.name || applicationId}`.slice(0, 5000),
      data_sources: dataSources,
      response: result.text?.slice(0, 10000) || '',
      provider: result.provider,
      model: result.model,
      correlation_id: correlationId,
      latency_ms: latencyMs,
      tokens_used: result.tokensUsed || 0,
      error: result.error || null,
      application_id: applicationId,
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
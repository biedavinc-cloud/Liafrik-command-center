import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { getProviderStatus } from '../../shared/aiGateway.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden: admin required' }, { status: 403 });

    const status = getProviderStatus();
    return Response.json({
      provider: status.name,
      configured: status.configured,
      model: status.model,
      message: status.configured
        ? `AI provider '${status.name}' is connected (model: ${status.model}).`
        : 'AI Provider Not Connected. Configure GEMINI_API_KEY in Secrets to enable AI capabilities.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
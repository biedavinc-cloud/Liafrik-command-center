import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { neonRepo } from '../../shared/neonRepo.ts';

// Registration Token Generator — generates a one-time, expiring registration token
// for an application to connect to the Command Center via the LCP.
// The full token is returned ONCE and never stored. Only a masked hint is persisted.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json();
    const { application_id, environment = 'production' } = body;

    if (!application_id) return Response.json({ error: 'application_id is required' }, { status: 400 });

    // Generate a one-time registration token (crypto.randomUUID is available in Workers)
    const rawUuid = crypto.randomUUID().replace(/-/g, '');
    const token = `lcp_${rawUuid}`;
    const tokenHint = `${token.slice(0, 10)}••••${token.slice(-4)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h expiry

    // Persist only the masked hint — the full token is never stored
    await neonRepo('Application').update(application_id, {
      registration_token_hint: tokenHint,
      registration_status: 'active',
    });

    // Audit the token generation
    await neonRepo('AuditEvent').create({
      actor: user.email,
      actor_role: user.role,
      application_id,
      action: 'application.registration_token_generated',
      resource: 'application',
      resource_id: application_id,
      outcome: 'success',
      risk_level: 'high',
      after: JSON.stringify({ token_hint: tokenHint, expires_at: expiresAt, environment }),
    });

    return Response.json({
      token,
      token_hint: tokenHint,
      expires_at: expiresAt,
      environment,
      message: 'This token will only be shown once. Store it securely.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
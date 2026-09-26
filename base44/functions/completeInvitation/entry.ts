import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { token } = body;

    if (!token) return Response.json({ error: 'Missing invitation token' }, { status: 400 });

    // Find the invitation
    const invitations = await base44.asServiceRole.entities.Invitation.filter({ token });
    if (invitations.length === 0) return Response.json({ error: 'Invalid invitation' }, { status: 400 });

    const invitation = invitations[0];
    if (invitation.status === 'used') return Response.json({ error: 'Invitation already used' }, { status: 400 });
    if (invitation.status === 'revoked') return Response.json({ error: 'Invitation revoked' }, { status: 400 });

    // Verify email match — the authenticated user must match the invitation
    if (invitation.email !== user.email.toLowerCase()) {
      return Response.json({ error: 'Email mismatch — this invitation was sent to a different address' }, { status: 403 });
    }

    // Mark invitation as used
    await base44.asServiceRole.entities.Invitation.update(invitation.id, {
      status: 'used',
      used_at: new Date().toISOString(),
      used_by_email: user.email,
    });

    // Activate the Administrator record
    if (invitation.administrator_id) {
      await base44.asServiceRole.entities.Administrator.update(invitation.administrator_id, {
        status: 'active',
      });
    }

    // Create audit event
    await base44.asServiceRole.entities.AuditEvent.create({
      actor: user.full_name || user.email,
      actor_role: user.role,
      action: 'administrator.activated',
      resource: 'administrator',
      resource_id: invitation.email,
      outcome: 'success',
      risk_level: 'medium',
      before: { status: 'pending' },
      after: { status: 'active' },
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
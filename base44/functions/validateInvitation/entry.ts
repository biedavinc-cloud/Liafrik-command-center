import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { token } = body;

    if (!token) return Response.json({ valid: false, reason: 'missing_token' }, { status: 400 });

    // Use service role — the invitee is not yet authenticated
    const invitations = await base44.asServiceRole.entities.Invitation.filter({ token });
    if (invitations.length === 0) return Response.json({ valid: false, reason: 'not_found' });

    const invitation = invitations[0];
    if (invitation.status === 'used') return Response.json({ valid: false, reason: 'used' });
    if (invitation.status === 'revoked') return Response.json({ valid: false, reason: 'revoked' });

    // Check expiry
    const now = new Date();
    const expires = new Date(invitation.expires_at);
    if (now > expires) return Response.json({ valid: false, reason: 'expired' });

    return Response.json({
      valid: true,
      email: invitation.email,
      full_name: invitation.full_name,
      global_role: invitation.global_role,
    });
  } catch (error) {
    return Response.json({ valid: false, reason: 'error', error: error.message }, { status: 500 });
  }
}
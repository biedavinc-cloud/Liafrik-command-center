import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { neonRepo } from '../../shared/neonRepo.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — SuperAdmin only' }, { status: 403 });

    const body = await req.json();
    const { email, full_name, global_role, assignments, permissions } = body;

    // Validate input
    if (!email || !full_name || !full_name.trim()) {
      return Response.json({ error: 'Name and email are required' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Check for existing administrator with same email
    const existing = await neonRepo('Administrator').filter({ email: email.toLowerCase() });
    if (existing.length > 0) {
      return Response.json({ error: 'An administrator with this email already exists' }, { status: 409 });
    }

    // Check for existing pending invitation
    const existingInvites = await neonRepo('Invitation').filter({ email: email.toLowerCase(), status: 'pending' });
    if (existingInvites.length > 0) {
      // Revoke old pending invitation
      await neonRepo('Invitation').updateMany(
        { email: email.toLowerCase(), status: 'pending' },
        { $set: { status: 'revoked' } }
      );
    }

    // Generate secure token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Create Administrator record with status 'pending'
    const admin = await neonRepo('Administrator').create({
      full_name: full_name.trim(),
      email: email.toLowerCase(),
      global_role: global_role || 'none',
      assignments: assignments || [],
      permissions: permissions || [],
      status: 'pending',
      is_demo: false,
    });

    // Create Invitation record
    const invitation = await neonRepo('Invitation').create({
      email: email.toLowerCase(),
      full_name: full_name.trim(),
      global_role: global_role || 'none',
      assignments: assignments || [],
      permissions: permissions || [],
      token,
      status: 'pending',
      invited_by: user.full_name || user.email,
      invited_by_email: user.email,
      expires_at: expiresAt,
      administrator_id: admin.id,
    });

    // Create audit event
    await neonRepo('AuditEvent').create({
      actor: user.full_name || user.email,
      actor_role: user.role,
      action: 'administrator.invited',
      resource: 'administrator',
      resource_id: email.toLowerCase(),
      outcome: 'success',
      risk_level: 'medium',
      after: JSON.stringify({ global_role, assignments, permissions, invitation_id: invitation.id }),
    });

    // Send invitation email
    const appUrl = req.headers.get('origin') || 'https://control.liafrik.com';
    const registerUrl = `${appUrl}/register?invite=${token}`;
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email.toLowerCase(),
      subject: 'You are invited to Liafrik Command Center',
      body: `Hello ${full_name.trim()},\n\nYou have been invited by ${user.full_name || user.email} to join the Liafrik Command Center.\n\nClick the link below to create your account and activate your access:\n\n${registerUrl}\n\nThis invitation will expire in 7 days.\n\nIf you did not expect this invitation, please ignore this email.\n\n— Liafrik Command Center`,
    });

    return Response.json({ success: true, invitation_id: invitation.id, administrator_id: admin.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
import { createPlatform } from "../_shared/platform.js";
import { neonRepo } from "../_shared/neonRepo.js";
async function onRequestPost({ request: req, env }) {
  try {
    const platform = createPlatform(req, env);
    const user = await platform.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden \u2014 SuperAdmin only" }, { status: 403 });
    const body = await req.json();
    const { email, full_name, global_role, assignments, permissions } = body;
    if (!email || !full_name || !full_name.trim()) {
      return Response.json({ error: "Name and email are required" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Invalid email address" }, { status: 400 });
    }
    const existing = await neonRepo("Administrator").filter({ email: email.toLowerCase() });
    if (existing.length > 0) {
      return Response.json({ error: "An administrator with this email already exists" }, { status: 409 });
    }
    const existingInvites = await neonRepo("Invitation").filter({ email: email.toLowerCase(), status: "pending" });
    if (existingInvites.length > 0) {
      await neonRepo("Invitation").updateMany(
        { email: email.toLowerCase(), status: "pending" },
        { $set: { status: "revoked" } }
      );
    }
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3).toISOString();
    const admin = await neonRepo("Administrator").create({
      full_name: full_name.trim(),
      email: email.toLowerCase(),
      global_role: global_role || "none",
      assignments: assignments || [],
      permissions: permissions || [],
      status: "pending",
      is_demo: false
    });
    const invitation = await neonRepo("Invitation").create({
      email: email.toLowerCase(),
      full_name: full_name.trim(),
      global_role: global_role || "none",
      assignments: assignments || [],
      permissions: permissions || [],
      token,
      status: "pending",
      invited_by: user.full_name || user.email,
      invited_by_email: user.email,
      expires_at: expiresAt,
      administrator_id: admin.id
    });
    await neonRepo("AuditEvent").create({
      actor: user.full_name || user.email,
      actor_role: user.role,
      action: "administrator.invited",
      resource: "administrator",
      resource_id: email.toLowerCase(),
      outcome: "success",
      risk_level: "medium",
      after: JSON.stringify({ global_role, assignments, permissions, invitation_id: invitation.id })
    });
    const appUrl = req.headers.get("origin") || new URL(req.url).origin;
    const registerUrl = `${appUrl}/register?invite=${token}`;
    let emailSent = true;
    let emailError = null;
    try {
    await platform.asServiceRole.integrations.Core.SendEmail({
      to: email.toLowerCase(),
      subject: "You are invited to Liafrik Command Center",
      body: `Hello ${full_name.trim()},

You have been invited by ${user.full_name || user.email} to join the Liafrik Command Center.

Click the link below to create your account and activate your access:

${registerUrl}

This invitation will expire in 7 days.

If you did not expect this invitation, please ignore this email.

\u2014 Liafrik Command Center`
    });
    } catch (e) {
      emailSent = false;
      emailError = e.message;
    }
    return Response.json({ success: true, invitation_id: invitation.id, administrator_id: admin.id, invite_url: registerUrl, email_sent: emailSent, email_error: emailError });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
export {
  onRequestPost
};

// POST /api/reset-access — SuperAdmin action: actually revokes a target administrator's live
// sessions (deletes their rows from neon_auth.session), instead of only logging that it happened.
import { createSql } from '../_shared/neon.js';
import { neonRepo } from '../_shared/neonRepo.js';
import { createPlatform } from '../_shared/platform.js';

export async function onRequestPost({ request: req, env }) {
  try {
    const platform = createPlatform(req, env);
    const user = await platform.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden \u2014 SuperAdmin only' }, { status: 403 });

    const { email } = await req.json();
    if (!email) return Response.json({ error: 'Missing email' }, { status: 400 });
    const targetEmail = String(email).toLowerCase();

    const sql = createSql(env);
    const target = await sql('SELECT id FROM neon_auth."user" WHERE lower(email) = $1', [targetEmail]);
    if (!target[0]) {
      // No Neon Auth account yet (e.g. still-pending invite) — nothing to revoke, not an error.
      return Response.json({ success: true, sessions_revoked: 0 });
    }
    const revoked = await sql('DELETE FROM neon_auth.session WHERE "userId" = $1 RETURNING id', [target[0].id]);

    await neonRepo('AuditEvent').create({
      actor: user.full_name || user.email,
      actor_role: user.role,
      action: 'administrator.access_reset',
      resource: 'administrator',
      resource_id: targetEmail,
      outcome: 'success',
      risk_level: 'high',
      after: JSON.stringify({ sessions_revoked: revoked.length }),
    });

    return Response.json({ success: true, sessions_revoked: revoked.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/register — invite-only account creation on Neon Auth (public endpoint, invitation token required).
import { scryptAsync } from '@noble/hashes/scrypt';
import { bytesToHex, randomBytes } from '@noble/hashes/utils';
import { createSql } from '../_shared/neon.js';
import { neonRepo } from '../_shared/neonRepo.js';
import { setEnv } from '../_shared/runtime.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

// Same format as Better Auth: "<salt>:<hex(scrypt(NFKC(password), salt, N=16384, r=16, p=1, dkLen=64))>"
async function hashPassword(password) {
  const salt = bytesToHex(randomBytes(16));
  const key = await scryptAsync(password.normalize('NFKC'), salt, { N: 16384, r: 16, p: 1, dkLen: 64, maxmem: 128 * 16384 * 16 * 2 });
  return `${salt}:${bytesToHex(key)}`;
}

export async function onRequestPost({ request, env }) {
  try {
    setEnv(env);
    const { token, password, name } = await request.json();
    if (!token || !password) return json({ error: 'Missing token or password' }, 400);
    if (String(password).length < 8) return json({ error: 'Password must be at least 8 characters' }, 400);

    const invitation = (await neonRepo('Invitation').filter({ token }))[0];
    if (!invitation) return json({ error: 'Invalid invitation' }, 400);
    if (invitation.status === 'used') return json({ error: 'Invitation already used' }, 400);
    if (invitation.status === 'revoked') return json({ error: 'Invitation revoked' }, 400);
    if (new Date() > new Date(invitation.expires_at)) return json({ error: 'Invitation expired' }, 400);

    const email = String(invitation.email).toLowerCase();
    const sql = createSql(env);
    const existing = await sql('SELECT id FROM neon_auth."user" WHERE lower(email) = $1', [email]);
    if (existing[0]) return json({ error: 'An account with this email already exists. Use "Forgot password" to sign in.' }, 409);

    const hash = await hashPassword(String(password));
    const fullName = (name || invitation.full_name || email).toString();
    await sql(
      `WITH u AS (INSERT INTO neon_auth."user" (name, email, "emailVerified", role) VALUES ($1, $2, true, 'user') RETURNING id)
       INSERT INTO neon_auth.account ("accountId", "providerId", "userId", password, "updatedAt")
       SELECT u.id::text, 'credential', u.id, $3, now() FROM u`,
      [fullName, email, hash]
    );

    // Same effects as the former completeInvitation
    await neonRepo('Invitation').update(invitation.id, { status: 'used', used_at: new Date().toISOString(), used_by_email: email });
    if (invitation.administrator_id) await neonRepo('Administrator').update(invitation.administrator_id, { status: 'active' });
    await neonRepo('AuditEvent').create({
      actor: fullName, actor_role: 'user', action: 'administrator.activated', resource: 'administrator',
      resource_id: email, outcome: 'success', risk_level: 'medium',
      before: JSON.stringify({ status: 'pending' }), after: JSON.stringify({ status: 'active' }),
    });
    return json({ success: true, email });
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}

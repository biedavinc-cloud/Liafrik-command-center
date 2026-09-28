// Verifies the Neon Auth (Better Auth) JWT sent as `Authorization: Bearer <jwt>`.
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { createSql } from './neon.js';

const DEFAULT_JWKS =
  'https://ep-patient-pond-b1ee0una.neonauth.c-5.eu-central-1.aws.neon.tech/neondb/auth/.well-known/jwks.json';

let jwks;
function getJwks(env) {
  if (!jwks) jwks = createRemoteJWKSet(new URL(env.NEON_AUTH_JWKS_URL || DEFAULT_JWKS));
  return jwks;
}

// Returns { id, email, role } or null. Role is read from the database, never from the client.
export async function getUser(request, env) {
  const header = request.headers.get('Authorization') || '';
  if (!header.startsWith('Bearer ')) return null;
  try {
    const { payload } = await jwtVerify(header.slice(7), getJwks(env));
    if (!payload.sub) return null;
    const sql = createSql(env);
    const rows = await sql(
      'SELECT id, email, name, role FROM neon_auth."user" WHERE id = $1 AND COALESCE(banned, false) = false',
      [payload.sub]
    );
    if (!rows[0]) return null;
    const u = rows[0];
    const role = u.role || 'user';
    // Invite-only: anyone can sign up on Neon Auth, so non-admins must be a registered administrator.
    if (role !== 'admin') {
      const a = await sql(
        "SELECT 1 FROM administrators WHERE lower(email) = lower($1) AND status IN ('active','pending') LIMIT 1",
        [u.email]
      );
      if (!a[0]) return null;
    }
    return { id: u.id, email: u.email, full_name: u.name, role };
  } catch (e) {
    return null;
  }
}

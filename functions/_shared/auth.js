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
      'SELECT id, email, role FROM neon_auth."user" WHERE id = $1 AND COALESCE(banned, false) = false',
      [payload.sub]
    );
    if (!rows[0]) return null;
    return { id: rows[0].id, email: rows[0].email, role: rows[0].role || 'user' };
  } catch (e) {
    return null;
  }
}

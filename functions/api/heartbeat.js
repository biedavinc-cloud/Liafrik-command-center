// POST /api/heartbeat — called BY a connected application (not an admin user) to report it's
// alive. Authenticated with the token issued by "Generate Registration Token" (sent as
// `Authorization: Bearer <token>`), verified against the hash stored for that application.
import { createSql } from '../_shared/neon.js';

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export async function onRequestPost({ request, env }) {
  try {
    const header = request.headers.get('Authorization') || '';
    if (!header.startsWith('Bearer ')) return json({ error: 'Missing bearer token' }, 401);
    const token = header.slice(7);

    const body = await request.json().catch(() => ({}));
    const { application_id, status, uptime, response_ms, error_rate, version } = body;
    if (!application_id) return json({ error: 'application_id is required' }, 400);

    const sql = createSql(env);
    const rows = await sql(
      'SELECT id, api_secret_hash, registration_status, heartbeat_interval_sec FROM applications WHERE id = $1',
      [application_id]
    );
    const app = rows[0];
    if (!app?.api_secret_hash) return json({ error: 'Unknown application or no registration token issued' }, 404);
    if (app.registration_status === 'revoked') return json({ error: 'Registration token has been revoked' }, 403);

    const hash = await sha256Hex(token);
    if (!timingSafeEqual(hash, app.api_secret_hash)) return json({ error: 'Invalid token' }, 401);

    const sets = ['last_heartbeat = now()', 'updated_date = now()'];
    const params = [];
    let i = 1;
    if (typeof status === 'string') { sets.push(`status = $${i++}`); params.push(status); }
    if (typeof uptime === 'number') { sets.push(`uptime = $${i++}`); params.push(uptime); }
    if (typeof response_ms === 'number') { sets.push(`response_ms = $${i++}`); params.push(response_ms); }
    if (typeof error_rate === 'number') { sets.push(`error_rate = $${i++}`); params.push(error_rate); }
    if (typeof version === 'string') { sets.push(`version = $${i++}`); params.push(version); }
    params.push(application_id);
    await sql(`UPDATE applications SET ${sets.join(', ')} WHERE id = $${i}`, params);

    return json({ ok: true, heartbeat_interval_sec: app.heartbeat_interval_sec || 60 });
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}

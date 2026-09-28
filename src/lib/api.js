// Backend function gateway. Functions already ported to Cloudflare Pages Functions are
// called on /api with the Neon Auth JWT; the rest still go through Base44 until ported.
import { base44 } from '@/api/base44Client';
import { getAccessToken } from '@/lib/neonAuth';

const PORTED = { neonData: '/api/neon-data' };

export async function invokeFunction(name, payload = {}) {
  const path = PORTED[name];
  if (!path) return base44.functions.invoke(name, payload);
  const token = await getAccessToken();
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return { data };
}

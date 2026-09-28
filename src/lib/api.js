// Backend function gateway: every backend function is a Cloudflare Pages Function on /api/<kebab-name>,
// authenticated with the Neon Auth JWT.
import { getAccessToken } from '@/lib/neonAuth';

const toPath = (name) => `/api/${name.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}`;

export async function invokeFunction(name, payload = {}) {
  const token = await getAccessToken();
  const res = await fetch(toPath(name), {
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

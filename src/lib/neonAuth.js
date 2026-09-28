// Neon Auth (Better Auth) client — plain fetch.
const BASE = (import.meta.env.VITE_NEON_AUTH_URL ||
  'https://ep-patient-pond-b1ee0una.neonauth.c-5.eu-central-1.aws.neon.tech/neondb/auth').replace(/\/$/, '');

const K_SESSION = 'liafrik_session_token';
const K_JWT = 'liafrik_jwt';

const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
  del: (k) => { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};

async function request(path, { method = 'POST', body, bearer } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (bearer) headers.Authorization = `Bearer ${bearer}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.message || data?.error?.message || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return { data, res };
}

function jwtExpiry(jwt) {
  try { return JSON.parse(atob(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).exp * 1000; }
  catch { return 0; }
}

// Exchange the session for a JWT that our /api functions can verify via JWKS.
async function fetchJwt() {
  const session = store.get(K_SESSION);
  const { data, res } = await request('/token', { method: 'GET', bearer: session || undefined });
  const jwt = data?.token || res.headers.get('set-auth-jwt');
  if (!jwt) throw new Error('Unable to obtain access token');
  store.set(K_JWT, jwt);
  return jwt;
}

export async function getAccessToken() {
  const jwt = store.get(K_JWT);
  if (jwt && jwtExpiry(jwt) - Date.now() > 60_000) return jwt;
  if (!store.get(K_SESSION) && !jwt) return null;
  try { return await fetchJwt(); } catch { return null; }
}

export const hasSession = () => !!(store.get(K_SESSION) || store.get(K_JWT));

export async function signInEmail(email, password) {
  const { data, res } = await request('/sign-in/email', { body: { email, password } });
  const session = res.headers.get('set-auth-token') || data?.token || data?.session?.token;
  if (session) store.set(K_SESSION, session);
  const jwt = res.headers.get('set-auth-jwt') || data?.session?.access_token;
  if (jwt) store.set(K_JWT, jwt); else await fetchJwt();
  return data;
}

export async function getUser() {
  const token = await getAccessToken();
  if (!token) return null;
  const { data } = await request('/get-session', { method: 'GET', bearer: store.get(K_SESSION) || token });
  return data?.user ? { ...data.user, full_name: data.user.name } : null;
}

export async function signOut() {
  try { await request('/sign-out', { bearer: store.get(K_SESSION) || undefined }); } catch { /* ignore */ }
  store.del(K_SESSION);
  store.del(K_JWT);
}

export const requestPasswordReset = (email) =>
  request('/request-password-reset', { body: { email, redirectTo: `${window.location.origin}/reset-password` } });

export const resetPassword = (newPassword, token) =>
  request('/reset-password', { body: { newPassword, token } });

export const updateUser = (fields) =>
  request('/update-user', { body: fields, bearer: store.get(K_SESSION) || undefined });

// Service helpers for backend functions (auth, entity access, email, connector tokens).
import { neonRepo } from './neonRepo.js';
import { getUser } from './auth.js';
import { setEnv } from './runtime.js';

async function sendEmail(env, { to, subject, body, from_name }) {
  if (!env.RESEND_API_KEY) throw new Error('Email is not configured: set RESEND_API_KEY (and EMAIL_FROM) in Cloudflare');
  const from = env.EMAIL_FROM || 'Liafrik <onboarding@resend.dev>';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: from_name ? `${from_name} <${from.replace(/^.*<|>$/g, '')}>` : from, to: [to], subject, text: body }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Email send failed (${res.status})`);
  return { id: data.id };
}

// OAuth connectors are no longer provided by a platform: supply a token via env vars.
async function getConnection(env, name) {
  const key = name === 'github' ? 'GITHUB_TOKEN' : `${String(name).toUpperCase()}_ACCESS_TOKEN`;
  const accessToken = env[key];
  if (!accessToken) throw new Error(`Connector "${name}" is not configured (missing ${key})`);
  return { accessToken };
}

export function createPlatform(req, env) {
  setEnv(env);
  return {
    auth: { me: () => getUser(req, env) },
    asServiceRole: {
      entities: new Proxy({}, { get: (_, entity) => neonRepo(String(entity)) }),
      integrations: { Core: { SendEmail: (args) => sendEmail(env, args) } },
      connectors: { getConnection: (name) => getConnection(env, name) },
    },
  };
}

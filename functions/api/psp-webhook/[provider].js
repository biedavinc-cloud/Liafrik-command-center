// POST /api/psp-webhook/<provider> — receives payment confirmations from Stripe/Paystack and
// marks the matching payment_links row as paid. Public endpoint (called by the PSP, not the app),
// so it authenticates the request itself by verifying the provider's webhook signature — nothing
// is trusted without a valid signature.
import { createSql } from '../../_shared/neon.js';
import { neonRepo } from '../../_shared/neonRepo.js';
import { setEnv } from '../../_shared/runtime.js';

async function hmacHex(secret, message, hash) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function onRequestPost({ request, env, params }) {
  setEnv(env);
  const provider = String(params.provider || '').toLowerCase();
  const rawBody = await request.text();
  const sql = createSql(env);

  const rows = await sql(
    'SELECT id, secret_value, webhook_secret_value FROM payment_providers WHERE provider = $1 ORDER BY updated_date DESC LIMIT 1',
    [provider]
  );
  const config = rows[0];

  let verified = false;
  let reference = null;

  if (provider === 'stripe') {
    if (!config?.webhook_secret_value) return new Response('Webhook not configured for this provider', { status: 404 });
    const sigHeader = request.headers.get('Stripe-Signature') || '';
    const parts = Object.fromEntries(sigHeader.split(',').map((kv) => kv.split('=')));
    if (parts.t && parts.v1) {
      const expected = await hmacHex(config.webhook_secret_value, `${parts.t}.${rawBody}`, 'SHA-256');
      verified = timingSafeEqual(expected, parts.v1);
    }
    if (verified) {
      const event = JSON.parse(rawBody);
      if (event.type === 'checkout.session.completed' && event.data?.object?.payment_status === 'paid') {
        reference = event.data.object.id;
      }
    }
  } else if (provider === 'paystack') {
    // Paystack signs with your secret API key, not a separate webhook secret.
    if (!config?.secret_value) return new Response('Provider not configured', { status: 404 });
    const sigHeader = request.headers.get('x-paystack-signature') || '';
    const expected = await hmacHex(config.secret_value, rawBody, 'SHA-512');
    verified = timingSafeEqual(expected, sigHeader);
    if (verified) {
      const event = JSON.parse(rawBody);
      if (event.event === 'charge.success') {
        reference = event.data?.reference;
      }
    }
  } else {
    return new Response('This provider is not supported for webhooks yet', { status: 400 });
  }

  if (!verified) return new Response('Invalid signature', { status: 401 });

  if (reference) {
    const updated = await sql(
      "UPDATE payment_links SET status = 'paid', paid_at = now(), updated_date = now() WHERE provider_reference = $1 AND provider = $2 AND status != 'paid' RETURNING id, application_id, application_name, amount, currency",
      [reference, provider]
    );
    if (updated[0]) {
      await neonRepo('AuditEvent').create({
        actor: `${provider} webhook`,
        actor_role: 'system',
        action: 'payment_link.paid',
        resource: 'payment_link',
        resource_id: updated[0].id,
        application_id: updated[0].application_id,
        application_name: updated[0].application_name,
        outcome: 'success',
        risk_level: 'low',
        after: JSON.stringify({ status: 'paid', amount: updated[0].amount, currency: updated[0].currency }),
      }).catch(() => {});
    }
  }
  return new Response('ok', { status: 200 });
}

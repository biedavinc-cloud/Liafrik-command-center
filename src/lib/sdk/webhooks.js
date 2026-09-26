/**
 * @liafrik/control-sdk/webhooks
 *
 * Webhook sending and signature verification.
 * Applications send webhooks to the Command Center; the Command Center verifies
 * signatures to prevent spoofing.
 *
 * CONCEPTUAL — not implemented. Real implementation comes in Phase 4.
 */

export async function sendWebhook({ event, payload, endpoint, secret }) {
  // Sign the payload with HMAC-SHA256 using the shared secret
  // POST to endpoint with X-Liafrik-Signature header
  // Returns: { http_status, delivered }
  throw new Error('Not implemented — Phase 4');
}

export function verifySignature({ payload, signature, secret }) {
  // Verify the HMAC-SHA256 signature of the incoming webhook
  // Returns: boolean
  return false;
}
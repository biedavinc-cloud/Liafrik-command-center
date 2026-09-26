/**
 * @liafrik/control-sdk/auth
 *
 * Application → Command Center authentication.
 *
 * Flow:
 *   1. Application calls register() with a registration token
 *   2. Command Center validates the token and returns an API key
 *   3. Application calls handshake() to declare capabilities + metadata
 *   4. All subsequent calls use the API key + signed requests
 *
 * CONCEPTUAL — not implemented. Real implementation comes in Phase 4.
 */

export async function register({ registrationToken, apiUrl, appId }) {
  // POST {apiUrl}/register { registration_token, app_id }
  // Returns: { api_key, key_id, expires_at }
  // The API key is shown ONCE and never again.
  throw new Error('Not implemented — Phase 4');
}

export async function handshake({ apiKey, capabilities, metadata }) {
  // POST {apiUrl}/handshake { capabilities, metadata, protocol_version }
  // Returns: { connected: true, protocol_version, connector_version }
  throw new Error('Not implemented — Phase 4');
}

export function getToken() {
  // Returns the stored API key from secure storage (never localStorage in production)
  return null;
}

export function revokeToken() {
  // Clears the stored API key
}
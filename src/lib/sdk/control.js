/**
 * @liafrik/control-sdk/control
 *
 * Remote control operations — the Command Center sends actions to the application,
 * and the application reports its configuration.
 *
 * CONCEPTUAL — not implemented. Real implementation comes in Phase 4.
 */

export async function executeAction({ action, payload, correlationId }) {
  // The Command Center POSTs /actions to the application
  // Application validates the action against its capabilities + permissions
  // Returns: { accepted, action_id, result }
  throw new Error('Not implemented — Phase 4');
}

export async function getConfiguration() {
  // GET /settings — returns the application's configuration
  throw new Error('Not implemented — Phase 4');
}

export async function updateConfiguration({ config }) {
  // PATCH /settings — updates configuration (secrets are never sent back)
  throw new Error('Not implemented — Phase 4');
}
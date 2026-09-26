/**
 * @liafrik/control-sdk/health
 *
 * Health reporting and heartbeat.
 * Applications report their health status to the Command Center periodically.
 *
 * CONCEPTUAL — not implemented. Real implementation comes in Phase 4.
 */

export async function reportHealth({ status, uptime, version, metrics }) {
  // POST {apiUrl}/health { status, uptime, version, metrics }
  // The Command Center updates the application's health status.
  throw new Error('Not implemented — Phase 4');
}

export function startHeartbeat(intervalSec = 60) {
  // Sends a heartbeat to the Command Center at the given interval.
  // Returns a stop function.
  // const timer = setInterval(() => reportHealth({...}), intervalSec * 1000);
  // return () => clearInterval(timer);
  return () => {};
}
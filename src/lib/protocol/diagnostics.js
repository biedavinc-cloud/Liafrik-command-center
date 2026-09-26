// Connection diagnostics model — the structured checks the Command Center runs
// against a connected application. Each check has a status and optional detail.
// The server-side testConnection function fills these in; the UI renders them.

export const DIAGNOSTIC_CHECKS = [
  'dns',
  'https',
  'api',
  'authentication',
  'authorization',
  'health',
  'capabilities',
  'webhook',
  'latency',
];

export const CHECK_STATUS = {
  pass: 'pass',
  warning: 'warning',
  fail: 'fail',
  not_tested: 'not_tested',
};

// Build a diagnostics result object from a raw test result (from testConnection backend function).
// Checks that require the credential vault / LCP gateway are reported as 'not_tested'.
export function buildDiagnostics(result) {
  const api = result?.api || {};
  const health = result?.health || {};
  const checks = {};

  // DNS + HTTPS: if the API probe reached the host at all, DNS and TLS succeeded.
  checks.dns = api.reachable
    ? { status: CHECK_STATUS.pass, detail: null }
    : { status: CHECK_STATUS.fail, detail: api.error || 'DNS resolution failed' };

  checks.https = api.reachable
    ? { status: CHECK_STATUS.pass, detail: null }
    : { status: CHECK_STATUS.fail, detail: api.error === 'timeout' ? 'Timed out' : 'TLS or connection failed' };

  // API reachability
  checks.api = api.reachable
    ? { status: api.ok ? CHECK_STATUS.pass : CHECK_STATUS.warning, detail: `HTTP ${api.http_status}` }
    : { status: CHECK_STATUS.fail, detail: 'Host unreachable' };

  // Authentication — requires the credential vault (next phase)
  checks.authentication = { status: CHECK_STATUS.not_tested, detail: 'Requires the server-side credential vault' };

  // Authorization — requires the LCP gateway
  checks.authorization = { status: CHECK_STATUS.not_tested, detail: 'Requires the Control Protocol gateway' };

  // Health endpoint
  checks.health = health.reachable
    ? { status: health.ok ? CHECK_STATUS.pass : CHECK_STATUS.warning, detail: `HTTP ${health.http_status}` }
    : { status: CHECK_STATUS.fail, detail: health.error || 'Health endpoint unreachable' };

  // Capabilities — requires the LCP gateway
  checks.capabilities = { status: CHECK_STATUS.not_tested, detail: 'Requires the Control Protocol gateway' };

  // Webhook — requires the LCP gateway
  checks.webhook = { status: CHECK_STATUS.not_tested, detail: 'Requires the Control Protocol gateway' };

  // Latency
  checks.latency = api.reachable
    ? {
        status: api.latency_ms < 500 ? CHECK_STATUS.pass : api.latency_ms < 2000 ? CHECK_STATUS.warning : CHECK_STATUS.fail,
        detail: `${api.latency_ms} ms`,
      }
    : { status: CHECK_STATUS.not_tested, detail: null };

  const passed = Object.values(checks).filter((c) => c.status === CHECK_STATUS.pass).length;
  const total = DIAGNOSTIC_CHECKS.length;
  const allPassed = passed === total;
  const hasFail = Object.values(checks).some((c) => c.status === CHECK_STATUS.fail);

  return { checks, passed, total, allPassed, hasFail, tested_at: result?.tested_at || new Date().toISOString() };
}

// Overall connection verdict from diagnostics
export function diagnosticsVerdict(diagnostics) {
  if (!diagnostics) return 'unknown';
  if (diagnostics.hasFail) return 'error';
  const tested = Object.values(diagnostics.checks).filter((c) => c.status !== CHECK_STATUS.not_tested);
  if (tested.length === 0) return 'pending';
  if (tested.every((c) => c.status === CHECK_STATUS.pass)) return 'configured';
  if (tested.some((c) => c.status === CHECK_STATUS.warning)) return 'degraded';
  return 'pending';
}
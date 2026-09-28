import { createPlatform } from "../_shared/platform.js";
const BLOCKED = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|172\.(1[6-9]|2\d|3[01])\.)/;
function validUrl(value) {
  try {
    const u = new URL(value);
    if (!["http:", "https:"].includes(u.protocol)) return null;
    if (BLOCKED.test(u.hostname)) return null;
    return u;
  } catch (_) {
    return null;
  }
}
async function probe(url) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6e3);
  try {
    const res = await fetch(url, { method: "GET", signal: controller.signal, redirect: "follow" });
    return { reachable: true, ok: res.ok, http_status: res.status, latency_ms: Date.now() - started };
  } catch (e) {
    return { reachable: false, ok: false, http_status: null, latency_ms: Date.now() - started, error: e.name === "AbortError" ? "timeout" : "unreachable" };
  } finally {
    clearTimeout(timer);
  }
}
async function testConnection_default(req) {
  try {
    const platform = createPlatform(req, env);
    const user = await platform.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });
    const { api_url, health_endpoint } = await req.json();
    const base = validUrl(api_url || "");
    if (!base) return Response.json({ error: "invalid_url" }, { status: 400 });
    const healthPath = typeof health_endpoint === "string" && health_endpoint.length < 200 ? health_endpoint : "/health";
    const healthUrl = new URL(healthPath, base.href.endsWith("/") ? base.href : base.href + "/").href;
    const [api, health] = await Promise.all([probe(base.href), probe(healthUrl)]);
    return Response.json({ api, health, tested_at: (/* @__PURE__ */ new Date()).toISOString() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
export {
  testConnection_default as default
};

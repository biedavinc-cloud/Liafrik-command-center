import { createPlatform } from "../_shared/platform.js";
import { neonRepo } from "../_shared/neonRepo.js";
const PROVIDER = "open-er-api";
const API_BASE = "https://open.er-api.com/v6/latest";
async function onRequestPost({ request: req, env }) {
  try {
    const platform = createPlatform(req, env);
    const user = await platform.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const method = req.method || "POST";
    const body = method === "GET" ? { base: new URL(req.url).searchParams.get("base") || "USD" } : await req.json().catch(() => ({}));
    const base = (body.base || "USD").toUpperCase();
    const repo = neonRepo("CurrencyRate");
    if (method === "GET") {
      const rows = await repo.filter({ base_currency: base }, "-fetched_at", 1);
      if (rows[0]) return Response.json(rows[0]);
      return Response.json({ base_currency: base, rates: {}, fetched_at: null, provider: null });
    }
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });
    const res = await fetch(`${API_BASE}/${base}`);
    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      return Response.json({ error: `Exchange rate API ${res.status}: ${errText.slice(0, 200)}` }, { status: 502 });
    }
    const data = await res.json();
    if (data.result !== "success" || !data.rates) {
      return Response.json({ error: "Exchange rate API returned an error", detail: data }, { status: 502 });
    }
    const record = await repo.create({
      base_currency: base,
      rates: data.rates,
      provider: PROVIDER,
      fetched_at: new Date(data.time_last_update_unix ? data.time_last_update_unix * 1e3 : Date.now()).toISOString()
    });
    const auditRepo = neonRepo("AuditEvent");
    await auditRepo.create({
      actor: user.email,
      actor_role: user.role,
      action: "currency_rates.sync",
      resource: "currency_rates",
      resource_id: record.id,
      outcome: "success",
      risk_level: "low",
      correlation_id: `fx_${Date.now()}`
    });
    return Response.json({
      base_currency: base,
      rates: data.rates,
      provider: PROVIDER,
      fetched_at: record.fetched_at,
      rate_count: Object.keys(data.rates).length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
export {
  onRequestPost
};

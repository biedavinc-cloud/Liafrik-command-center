import { createPlatform } from "../_shared/platform.js";
import { neonRepo } from "../_shared/neonRepo.js";
async function onRequestPost({ request: req, env }) {
  try {
    const platform = createPlatform(req, env);
    const user = await platform.auth.me();
    const body = await req.json().catch(() => ({}));
    const operation = body.operation || "get";
    const repo = neonRepo("Branding");
    if (operation === "get") {
      const rows = await repo.filter({ key: "global" });
      return Response.json(rows[0] || { key: "global", organization_name: null, logo_url: null });
    }
    if (operation === "set") {
      if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
      if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });
      const allowed = [
        "organization_name",
        "organization_description",
        "logo_url",
        "logo_dark_url",
        "favicon_url",
        "primary_color"
      ];
      const data = { updated_by: user.email };
      for (const k of allowed) {
        if (body[k] !== void 0) data[k] = body[k];
      }
      const existing = await repo.filter({ key: "global" });
      let result;
      if (existing[0]) {
        result = await repo.update(existing[0].id, data);
      } else {
        data.key = "global";
        result = await repo.create(data);
      }
      const auditRepo = neonRepo("AuditEvent");
      await auditRepo.create({
        actor: user.email,
        actor_role: user.role,
        action: "branding.update",
        resource: "branding",
        resource_id: result.id,
        outcome: "success",
        risk_level: "medium",
        correlation_id: `branding_${Date.now()}`
      });
      return Response.json(result);
    }
    return Response.json({ error: "Unknown operation" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
export {
  onRequestPost
};

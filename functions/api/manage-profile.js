import { createPlatform } from "../_shared/platform.js";
import { neonRepo } from "../_shared/neonRepo.js";
async function onRequestPost({ request: req, env }) {
  try {
    const platform = createPlatform(req, env);
    const user = await platform.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const operation = body.operation || "get";
    const repo = neonRepo("StaffProfile");
    if (operation === "get") {
      const rows = await repo.filter({ user_id: user.id });
      return Response.json(rows[0] || { user_id: user.id, photo_url: null, job_title: null, department: null, phone: null, timezone: "Asia/Dubai" });
    }
    if (operation === "set") {
      const allowed = ["photo_url", "job_title", "department", "phone", "timezone", "notification_prefs"];
      const data = { user_id: user.id };
      for (const k of allowed) {
        if (body[k] !== void 0) data[k] = body[k];
      }
      const existing = await repo.filter({ user_id: user.id });
      let result;
      if (existing[0]) {
        result = await repo.update(existing[0].id, data);
      } else {
        result = await repo.create(data);
      }
      const auditRepo = neonRepo("AuditEvent");
      await auditRepo.create({
        actor: user.email,
        actor_role: user.role,
        action: "profile.update",
        resource: "staff_profile",
        resource_id: result.id,
        outcome: "success",
        risk_level: "low",
        correlation_id: `profile_${Date.now()}`
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

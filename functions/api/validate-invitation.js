import { createPlatform } from "../_shared/platform.js";
import { neonRepo } from "../_shared/neonRepo.js";
async function onRequestPost({ request: req, env }) {
  try {
    const platform = createPlatform(req, env);
    const body = await req.json();
    const { token } = body;
    if (!token) return Response.json({ valid: false, reason: "missing_token" }, { status: 400 });
    const invitations = await neonRepo("Invitation").filter({ token });
    if (invitations.length === 0) return Response.json({ valid: false, reason: "not_found" });
    const invitation = invitations[0];
    if (invitation.status === "used") return Response.json({ valid: false, reason: "used" });
    if (invitation.status === "revoked") return Response.json({ valid: false, reason: "revoked" });
    const now = /* @__PURE__ */ new Date();
    const expires = new Date(invitation.expires_at);
    if (now > expires) return Response.json({ valid: false, reason: "expired" });
    return Response.json({
      valid: true,
      email: invitation.email,
      full_name: invitation.full_name,
      global_role: invitation.global_role
    });
  } catch (error) {
    return Response.json({ valid: false, reason: "error", error: error.message }, { status: 500 });
  }
}
export {
  onRequestPost
};

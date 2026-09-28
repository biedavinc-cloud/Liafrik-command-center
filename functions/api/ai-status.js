import { createPlatform } from "../_shared/platform.js";
import { getProviderStatus } from "../_shared/aiGateway.js";
async function onRequestPost({ request: req, env }) {
  try {
    const platform = createPlatform(req, env);
    const user = await platform.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden: admin required" }, { status: 403 });
    const status = getProviderStatus();
    return Response.json({
      provider: status.name,
      configured: status.configured,
      model: status.model,
      message: status.configured ? `AI provider '${status.name}' is connected (model: ${status.model}).` : "AI Provider Not Connected. Configure GEMINI_API_KEY in Secrets to enable AI capabilities."
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
export {
  onRequestPost
};

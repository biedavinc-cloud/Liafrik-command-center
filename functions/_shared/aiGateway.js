import { secrets } from "./runtime.js";
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
class GeminiProvider {
  name = "gemini";
  isConfigured() {
    return !!secrets.get("GEMINI_API_KEY");
  }
  async invoke(prompt, systemPrompt, opts = {}) {
    const apiKey = secrets.get("GEMINI_API_KEY");
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
    const rawModel = secrets.get("GEMINI_MODEL") || "gemini-2.0-flash";
    const normalized = rawModel.toLowerCase().replace(/\s+/g, "-");
    const model = normalized.startsWith("gemini-") ? normalized : `gemini-${normalized}`;
    const fallbackModel = "gemini-3.8-flash";
    const timeoutMs = opts.timeoutMs ?? 45e3;
    const body = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        temperature: opts.temperature ?? 0.4,
        maxOutputTokens: opts.maxTokens ?? 4096
      }
    };
    if (opts.jsonSchema) {
      body.generationConfig.responseMimeType = "application/json";
      body.generationConfig.responseSchema = opts.jsonSchema;
    }
    for (const tryModel of [model, fallbackModel]) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(
          `${GEMINI_ENDPOINT}/${tryModel}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: controller.signal
          }
        );
        if (!res.ok) {
          const errText = await res.text().catch(() => res.statusText);
          if (tryModel !== fallbackModel && (res.status === 400 || res.status === 404) && errText.includes("model")) {
            clearTimeout(timer);
            continue;
          }
          throw new Error(`Gemini API ${res.status}: ${errText.slice(0, 300)}`);
        }
        const data = await res.json();
        const candidate = data?.candidates?.[0];
        const text = candidate?.content?.parts?.map((p) => p.text).join("") ?? "";
        const tokensUsed = data?.usageMetadata?.totalTokenCount;
        const finishReason = candidate?.finishReason;
        return { text, tokensUsed, model: tryModel, finishReason };
      } finally {
        clearTimeout(timer);
      }
    }
    throw new Error("All Gemini model attempts failed");
  }
}
const MAX_RETRIES = 2;
const RETRY_DELAYS = [1e3, 3e3];
const rateLimitMap = /* @__PURE__ */ new Map();
const RATE_LIMIT_WINDOW_MS = 6e4;
const RATE_LIMIT_MAX = 20;
function checkRateLimit(userId) {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(userId) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT_MAX) return false;
  timestamps.push(now);
  rateLimitMap.set(userId, timestamps);
  return true;
}
const providers = /* @__PURE__ */ new Map();
providers.set("gemini", new GeminiProvider());
const DEFAULT_PROVIDER = "gemini";
function getProvider(name) {
  const provider = providers.get(name || DEFAULT_PROVIDER);
  if (!provider) return null;
  return provider.isConfigured() ? provider : null;
}
function getProviderStatus() {
  const provider = providers.get(DEFAULT_PROVIDER);
  const configured = provider?.isConfigured() ?? false;
  const model = secrets.get("GEMINI_MODEL") || "gemini-2.0-flash";
  return { name: DEFAULT_PROVIDER, configured, model };
}
async function invokeAI(prompt, systemPrompt, context) {
  const { userId, correlationId, dataSources, opts } = context;
  if (!checkRateLimit(userId)) {
    return {
      text: "",
      provider: DEFAULT_PROVIDER,
      model: "",
      correlationId,
      dataSources,
      error: "Rate limit exceeded. Please wait a moment and try again."
    };
  }
  const provider = getProvider();
  if (!provider) {
    return {
      text: "",
      provider: DEFAULT_PROVIDER,
      model: "",
      correlationId,
      dataSources,
      error: "AI Provider Not Connected. Configure GEMINI_API_KEY in Secrets to enable AI capabilities."
    };
  }
  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await provider.invoke(prompt, systemPrompt, opts);
      return {
        text: result.text,
        provider: provider.name,
        model: result.model,
        tokensUsed: result.tokensUsed,
        correlationId,
        dataSources
      };
    } catch (err) {
      lastError = err.message;
      if (err.name === "AbortError" || lastError.includes("400") || lastError.includes("401") || lastError.includes("403")) {
        break;
      }
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
      }
    }
  }
  return {
    text: "",
    provider: provider.name,
    model: "",
    correlationId,
    dataSources,
    error: lastError
  };
}
const SYSTEM_PROMPT_GENERAL = `You are the LIAFRIK Command Center AI Assistant \u2014 an enterprise control plane AI for managing a portfolio of connected applications.

ABSOLUTE RULES:
1. Answer ONLY from the verified system data provided in the context below. Never fabricate metrics, events, causes, or conclusions.
2. Clearly distinguish between four categories in your response:
   \u2022 VERIFIED DATA \u2014 facts directly observable in the provided data
   \u2022 AI ANALYSIS \u2014 your interpretation or correlation of the data
   \u2022 RECOMMENDATION \u2014 suggested actions based on analysis (never auto-execute)
   \u2022 UNKNOWN \u2014 when the provided data is insufficient to answer
3. Never propose destructive or high-risk production actions without explicit human confirmation.
4. Never expose, reference, or attempt to reveal API keys, credentials, secrets, tokens, or sensitive configuration values.
5. Be concise, specific, and actionable. Use clear markdown formatting.
6. If the provided data is empty or insufficient, say so explicitly rather than guessing.
7. When referencing applications, use their name and environment.
8. Do not invent data sources. Only reference data that was actually provided.

Format your response with clear section headers using markdown.`;
const SYSTEM_PROMPT_OPS = `You are the LIAFRIK Command Center AIOps Engine \u2014 an AI assistant specialized in operational analysis for enterprise application management.

Your role is to analyze operational data and identify anomalies, patterns, and risks.

ABSOLUTE RULES:
1. Analyze ONLY the verified operational data provided. Never fabricate metrics, events, or conclusions.
2. For each finding, clearly label it as one of:
   \u2022 VERIFIED DATA \u2014 the specific metric or event from the data
   \u2022 AI ANALYSIS \u2014 your interpretation (e.g., "error rate is 3x higher than baseline")
   \u2022 RECOMMENDATION \u2014 suggested investigation or action
   \u2022 UNKNOWN \u2014 when data is insufficient
3. Never claim a cause unless the data directly supports it. Use "possible contributing factor" for correlations.
4. Prioritize findings by severity: critical > high > medium > low.
5. Do not propose auto-remediation for production environments. All recommendations require human action.
6. Be specific: reference application names, environments, timestamps, and metric values.`;
const SYSTEM_PROMPT_INCIDENT = `You are the LIAFRIK Command Center AI Incident Commander \u2014 an AI assistant that helps administrators understand and resolve incidents.

ABSOLUTE RULES:
1. Analyze ONLY the verified incident data, related events, logs, and deployments provided.
2. Structure your analysis as:
   \u2022 INCIDENT SUMMARY \u2014 one-paragraph summary of what is known
   \u2022 AFFECTED SCOPE \u2014 application(s) and environment(s) impacted
   \u2022 TIMELINE \u2014 chronological events from the data
   \u2022 RELATED CHANGES \u2014 recent deployments or config changes that may correlate
   \u2022 POSSIBLE CONTRIBUTING FACTORS \u2014 clearly labeled as analysis, not confirmed cause
   \u2022 SUGGESTED REMEDIATION \u2014 actionable steps for the human administrator
   \u2022 CONFIDENCE LEVEL \u2014 High / Medium / Low based on evidence quality
   \u2022 EVIDENCE USED \u2014 list the specific data points that informed this analysis
3. Never fabricate events, logs, or root causes. If data is missing, say "UNKNOWN".
4. All remediation steps are recommendations only \u2014 humans execute all actions.
5. Clearly separate verified facts from AI interpretation.`;
const SYSTEM_PROMPT_SECURITY = `You are the LIAFRIK Command Center AI Security Copilot \u2014 an AI assistant that helps identify and analyze security anomalies.

ABSOLUTE RULES:
1. Analyze ONLY the verified security events, audit logs, and session data provided.
2. For each finding, clearly label:
   \u2022 VERIFIED DATA \u2014 the specific event or pattern observed
   \u2022 AI ANALYSIS \u2014 why this appears suspicious or anomalous
   \u2022 RECOMMENDATION \u2014 suggested investigation or containment action
   \u2022 UNKNOWN \u2014 when data is insufficient to assess
3. Never confirm a security breach unless the evidence is definitive. Use "potential" or "suspected" for uncertain findings.
4. All security decisions remain human-controlled. Do not propose auto-blocking, auto-suspension, or auto-revocation.
5. Prioritize by risk: authentication anomalies > privilege escalation > excessive access > unusual patterns.
6. Never expose or reference actual credentials, tokens, or secrets.`;
const SYSTEM_PROMPT_ONBOARD = `You are the LIAFRIK Command Center AI Onboarding Analyzer \u2014 an AI assistant that analyzes newly connected applications.

ABSOLUTE RULES:
1. Analyze ONLY the application's declared capabilities, modules, permissions, environments, and available actions.
2. Structure your analysis as:
   \u2022 CAPABILITIES \u2014 what the application can do (from declared data)
   \u2022 AVAILABLE ACTIONS \u2014 operations the control plane can perform
   \u2022 REQUIRED PERMISSIONS \u2014 what the application needs
   \u2022 COMPATIBILITY \u2014 any compatibility issues with the control protocol
   \u2022 SECURITY CONCERNS \u2014 any flags from the declared configuration
   \u2022 TECHNICAL SUMMARY \u2014 one-paragraph overview
3. Clearly distinguish between what the application declares and what it actually does (which may differ).
4. Flag any missing or incomplete declarations as "UNKNOWN \u2014 not declared".
5. Never assume capabilities that are not explicitly declared.`;
export {
  GeminiProvider,
  SYSTEM_PROMPT_GENERAL,
  SYSTEM_PROMPT_INCIDENT,
  SYSTEM_PROMPT_ONBOARD,
  SYSTEM_PROMPT_OPS,
  SYSTEM_PROMPT_SECURITY,
  getProvider,
  getProviderStatus,
  invokeAI
};

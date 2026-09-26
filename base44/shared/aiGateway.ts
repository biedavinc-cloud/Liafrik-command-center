import { secrets } from 'base44:runtime';

// ─────────────────────────────────────────────────────────────
// AI Provider Abstraction
// Provider-agnostic interface. Gemini is the first implementation.
// Additional providers (OpenAI, Anthropic, etc.) can be added by
// implementing the AIProvider interface and registering in the gateway.
// ─────────────────────────────────────────────────────────────

export interface AIProvider {
  readonly name: string;
  isConfigured(): boolean;
  invoke(prompt: string, systemPrompt: string, opts?: AIInvokeOpts): Promise<AIInvokeResult>;
}

export interface AIInvokeOpts {
  temperature?: number;
  maxTokens?: number;
  jsonSchema?: Record<string, any>;
  timeoutMs?: number;
}

export interface AIInvokeResult {
  text: string;
  tokensUsed?: number;
  model: string;
  finishReason?: string;
}

// ─────────────────────────────────────────────────────────────
// Gemini Provider — calls the Gemini REST API directly with the
// server-side GEMINI_API_KEY secret. Never exposed to the frontend.
// ─────────────────────────────────────────────────────────────

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';

  isConfigured(): boolean {
    return !!secrets.get('GEMINI_API_KEY');
  }

  async invoke(prompt: string, systemPrompt: string, opts: AIInvokeOpts = {}): Promise<AIInvokeResult> {
    const apiKey = secrets.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

    const rawModel = secrets.get('GEMINI_MODEL') || 'gemini-2.0-flash';
    // Normalize model name: lowercase, replace spaces with hyphens, prepend gemini- if needed
    const normalized = rawModel.toLowerCase().replace(/\s+/g, '-');
    const model = normalized.startsWith('gemini-') ? normalized : `gemini-${normalized}`;
    const fallbackModel = 'gemini-3.8-flash';
    const timeoutMs = opts.timeoutMs ?? 45_000;

    const body: any = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        temperature: opts.temperature ?? 0.4,
        maxOutputTokens: opts.maxTokens ?? 4096,
      },
    };
    if (opts.jsonSchema) {
      body.generationConfig.responseMimeType = 'application/json';
      body.generationConfig.responseSchema = opts.jsonSchema;
    }

    // Try with configured model, fall back to gemini-2.0-flash on model name errors
    for (const tryModel of [model, fallbackModel]) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(
          `${GEMINI_ENDPOINT}/${tryModel}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal,
          },
        );

        if (!res.ok) {
          const errText = await res.text().catch(() => res.statusText);
          // If model name is invalid and we haven't tried fallback yet, continue to next model
          if (tryModel !== fallbackModel && (res.status === 400 || res.status === 404) && errText.includes('model')) {
            clearTimeout(timer);
            continue;
          }
          throw new Error(`Gemini API ${res.status}: ${errText.slice(0, 300)}`);
        }

        const data = await res.json();
        const candidate = data?.candidates?.[0];
        const text = candidate?.content?.parts?.map((p: any) => p.text).join('') ?? '';
        const tokensUsed = data?.usageMetadata?.totalTokenCount;
        const finishReason = candidate?.finishReason;

        return { text, tokensUsed, model: tryModel, finishReason };
      } finally {
        clearTimeout(timer);
      }
    }

    throw new Error('All Gemini model attempts failed');
  }
}

// ─────────────────────────────────────────────────────────────
// AI Gateway — manages providers, retry, rate limiting, governance
// ─────────────────────────────────────────────────────────────

const MAX_RETRIES = 2;
const RETRY_DELAYS = [1_000, 3_000]; // exponential backoff

// Simple in-memory rate limiter: max N requests per minute per user
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(userId) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT_MAX) return false;
  timestamps.push(now);
  rateLimitMap.set(userId, timestamps);
  return true;
}

const providers = new Map<string, AIProvider>();
providers.set('gemini', new GeminiProvider());

const DEFAULT_PROVIDER = 'gemini';

export function getProvider(name?: string): AIProvider | null {
  const provider = providers.get(name || DEFAULT_PROVIDER);
  if (!provider) return null;
  return provider.isConfigured() ? provider : null;
}

export function getProviderStatus(): { name: string; configured: boolean; model: string } {
  const provider = providers.get(DEFAULT_PROVIDER);
  const configured = provider?.isConfigured() ?? false;
  const model = secrets.get('GEMINI_MODEL') || 'gemini-2.0-flash';
  return { name: DEFAULT_PROVIDER, configured, model };
}

export interface AIGatewayResult {
  text: string;
  provider: string;
  model: string;
  tokensUsed?: number;
  correlationId: string;
  dataSources: string[];
  error?: string;
}

export async function invokeAI(
  prompt: string,
  systemPrompt: string,
  context: { userId: string; correlationId: string; dataSources: string[]; opts?: AIInvokeOpts },
): Promise<AIGatewayResult> {
  const { userId, correlationId, dataSources, opts } = context;

  // Rate limit
  if (!checkRateLimit(userId)) {
    return {
      text: '',
      provider: DEFAULT_PROVIDER,
      model: '',
      correlationId,
      dataSources,
      error: 'Rate limit exceeded. Please wait a moment and try again.',
    };
  }

  const provider = getProvider();
  if (!provider) {
    return {
      text: '',
      provider: DEFAULT_PROVIDER,
      model: '',
      correlationId,
      dataSources,
      error: 'AI Provider Not Connected. Configure GEMINI_API_KEY in Secrets to enable AI capabilities.',
    };
  }

  let lastError: string;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await provider.invoke(prompt, systemPrompt, opts);
      return {
        text: result.text,
        provider: provider.name,
        model: result.model,
        tokensUsed: result.tokensUsed,
        correlationId,
        dataSources,
      };
    } catch (err) {
      lastError = err.message;
      // Don't retry on 4xx (client errors) or abort errors
      if (err.name === 'AbortError' || lastError.includes('400') || lastError.includes('401') || lastError.includes('403')) {
        break;
      }
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
      }
    }
  }

  return {
    text: '',
    provider: provider.name,
    model: '',
    correlationId,
    dataSources,
    error: lastError,
  };
}

// ─────────────────────────────────────────────────────────────
// System Prompts — constrain AI to verified data only
// ─────────────────────────────────────────────────────────────

export const SYSTEM_PROMPT_GENERAL = `You are the LIAFRIK Command Center AI Assistant — an enterprise control plane AI for managing a portfolio of connected applications.

ABSOLUTE RULES:
1. Answer ONLY from the verified system data provided in the context below. Never fabricate metrics, events, causes, or conclusions.
2. Clearly distinguish between four categories in your response:
   • VERIFIED DATA — facts directly observable in the provided data
   • AI ANALYSIS — your interpretation or correlation of the data
   • RECOMMENDATION — suggested actions based on analysis (never auto-execute)
   • UNKNOWN — when the provided data is insufficient to answer
3. Never propose destructive or high-risk production actions without explicit human confirmation.
4. Never expose, reference, or attempt to reveal API keys, credentials, secrets, tokens, or sensitive configuration values.
5. Be concise, specific, and actionable. Use clear markdown formatting.
6. If the provided data is empty or insufficient, say so explicitly rather than guessing.
7. When referencing applications, use their name and environment.
8. Do not invent data sources. Only reference data that was actually provided.

Format your response with clear section headers using markdown.`;

export const SYSTEM_PROMPT_OPS = `You are the LIAFRIK Command Center AIOps Engine — an AI assistant specialized in operational analysis for enterprise application management.

Your role is to analyze operational data and identify anomalies, patterns, and risks.

ABSOLUTE RULES:
1. Analyze ONLY the verified operational data provided. Never fabricate metrics, events, or conclusions.
2. For each finding, clearly label it as one of:
   • VERIFIED DATA — the specific metric or event from the data
   • AI ANALYSIS — your interpretation (e.g., "error rate is 3x higher than baseline")
   • RECOMMENDATION — suggested investigation or action
   • UNKNOWN — when data is insufficient
3. Never claim a cause unless the data directly supports it. Use "possible contributing factor" for correlations.
4. Prioritize findings by severity: critical > high > medium > low.
5. Do not propose auto-remediation for production environments. All recommendations require human action.
6. Be specific: reference application names, environments, timestamps, and metric values.`;

export const SYSTEM_PROMPT_INCIDENT = `You are the LIAFRIK Command Center AI Incident Commander — an AI assistant that helps administrators understand and resolve incidents.

ABSOLUTE RULES:
1. Analyze ONLY the verified incident data, related events, logs, and deployments provided.
2. Structure your analysis as:
   • INCIDENT SUMMARY — one-paragraph summary of what is known
   • AFFECTED SCOPE — application(s) and environment(s) impacted
   • TIMELINE — chronological events from the data
   • RELATED CHANGES — recent deployments or config changes that may correlate
   • POSSIBLE CONTRIBUTING FACTORS — clearly labeled as analysis, not confirmed cause
   • SUGGESTED REMEDIATION — actionable steps for the human administrator
   • CONFIDENCE LEVEL — High / Medium / Low based on evidence quality
   • EVIDENCE USED — list the specific data points that informed this analysis
3. Never fabricate events, logs, or root causes. If data is missing, say "UNKNOWN".
4. All remediation steps are recommendations only — humans execute all actions.
5. Clearly separate verified facts from AI interpretation.`;

export const SYSTEM_PROMPT_SECURITY = `You are the LIAFRIK Command Center AI Security Copilot — an AI assistant that helps identify and analyze security anomalies.

ABSOLUTE RULES:
1. Analyze ONLY the verified security events, audit logs, and session data provided.
2. For each finding, clearly label:
   • VERIFIED DATA — the specific event or pattern observed
   • AI ANALYSIS — why this appears suspicious or anomalous
   • RECOMMENDATION — suggested investigation or containment action
   • UNKNOWN — when data is insufficient to assess
3. Never confirm a security breach unless the evidence is definitive. Use "potential" or "suspected" for uncertain findings.
4. All security decisions remain human-controlled. Do not propose auto-blocking, auto-suspension, or auto-revocation.
5. Prioritize by risk: authentication anomalies > privilege escalation > excessive access > unusual patterns.
6. Never expose or reference actual credentials, tokens, or secrets.`;

export const SYSTEM_PROMPT_ONBOARD = `You are the LIAFRIK Command Center AI Onboarding Analyzer — an AI assistant that analyzes newly connected applications.

ABSOLUTE RULES:
1. Analyze ONLY the application's declared capabilities, modules, permissions, environments, and available actions.
2. Structure your analysis as:
   • CAPABILITIES — what the application can do (from declared data)
   • AVAILABLE ACTIONS — operations the control plane can perform
   • REQUIRED PERMISSIONS — what the application needs
   • COMPATIBILITY — any compatibility issues with the control protocol
   • SECURITY CONCERNS — any flags from the declared configuration
   • TECHNICAL SUMMARY — one-paragraph overview
3. Clearly distinguish between what the application declares and what it actually does (which may differ).
4. Flag any missing or incomplete declarations as "UNKNOWN — not declared".
5. Never assume capabilities that are not explicitly declared.`;
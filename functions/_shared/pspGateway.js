import { secrets } from "./runtime.js";
const PSP_PROVIDERS = {
  nexapay: {
    key: "nexapay",
    display_name: "NexaPay",
    description: "Liafrik's own payment service provider",
    capabilities: ["payment_links", "payment_creation", "payment_status", "refunds", "webhooks", "customer_metadata"],
    supported_currencies: ["USD", "EUR", "AED", "NGN", "GHS", "KES", "ZAR", "XOF", "XAF"],
    supported_countries: ["AE", "NG", "GH", "KE", "ZA", "CI", "SN", "FR", "US"],
    secret_key_env: "PSP_NEXAPAY_API_KEY",
    webhook_secret_env: "PSP_NEXAPAY_WEBHOOK_SECRET",
    color: "#6366f1",
    logo_url: ""
  },
  korapay: {
    key: "korapay",
    display_name: "Korapay",
    description: "African payment infrastructure",
    capabilities: ["payment_links", "payment_creation", "payment_status", "refunds", "webhooks"],
    supported_currencies: ["USD", "EUR", "NGN", "GHS", "KES", "ZAR", "XOF", "XAF"],
    supported_countries: ["NG", "GH", "KE", "ZA", "CI", "SN"],
    secret_key_env: "PSP_KORAPAY_SECRET_KEY",
    webhook_secret_env: "PSP_KORAPAY_WEBHOOK_SECRET",
    color: "#0ea5e9",
    logo_url: ""
  },
  stripe: {
    key: "stripe",
    display_name: "Stripe",
    description: "Global payment processing",
    capabilities: ["payment_links", "payment_creation", "payment_status", "refunds", "webhooks", "customer_metadata", "subscriptions"],
    supported_currencies: ["USD", "EUR", "GBP", "AED", "CAD", "JPY", "CNY", "INR", "BRL", "AUD"],
    supported_countries: ["US", "GB", "FR", "DE", "CA", "AE", "NG", "GH", "KE", "ZA"],
    secret_key_env: "PSP_STRIPE_SECRET_KEY",
    webhook_secret_env: "PSP_STRIPE_WEBHOOK_SECRET",
    docs_url: "https://stripe.com/docs/api",
    color: "#635bff",
    logo_url: "https://cdn.simpleicons.org/stripe"
  },
  paystack: {
    key: "paystack",
    display_name: "Paystack",
    description: "Nigerian and African payment gateway",
    capabilities: ["payment_links", "payment_creation", "payment_status", "refunds", "webhooks"],
    supported_currencies: ["NGN", "GHS", "ZAR", "KES", "USD"],
    supported_countries: ["NG", "GH", "ZA", "KE", "CI"],
    secret_key_env: "PSP_PAYSTACK_SECRET_KEY",
    webhook_secret_env: "PSP_PAYSTACK_WEBHOOK_SECRET",
    docs_url: "https://paystack.com/docs/api",
    color: "#0fbf7e",
    logo_url: "https://cdn.simpleicons.org/paystack"
  },
  flutterwave: {
    key: "flutterwave",
    display_name: "Flutterwave",
    description: "African payment technology",
    capabilities: ["payment_links", "payment_creation", "payment_status", "refunds", "webhooks", "customer_metadata"],
    supported_currencies: ["USD", "EUR", "GBP", "NGN", "GHS", "KES", "ZAR", "XOF", "XAF", "EGP", "RWF", "TZS", "UGX", "ZMW"],
    supported_countries: ["NG", "GH", "KE", "ZA", "CI", "EG", "RW", "TZ", "UG", "ZM"],
    secret_key_env: "PSP_FLUTTERWAVE_SECRET_KEY",
    webhook_secret_env: "PSP_FLUTTERWAVE_WEBHOOK_SECRET",
    docs_url: "https://developer.flutterwave.com",
    color: "#f9a826",
    logo_url: "https://cdn.simpleicons.org/flutterwave"
  },
  payunit: {
    key: "payunit",
    display_name: "PayUnit",
    description: "Central African payment aggregator",
    capabilities: ["payment_links", "payment_creation", "payment_status", "webhooks"],
    supported_currencies: ["XAF", "XOF", "USD", "EUR"],
    supported_countries: ["CM", "CI", "GA", "CG", "TD", "CF"],
    secret_key_env: "PSP_PAYUNIT_API_KEY",
    webhook_secret_env: "PSP_PAYUNIT_WEBHOOK_SECRET",
    color: "#e63946",
    logo_url: ""
  },
  paddle: {
    key: "paddle",
    display_name: "Paddle",
    description: "Subscription and digital product payments",
    capabilities: ["payment_links", "payment_creation", "payment_status", "refunds", "webhooks", "subscriptions", "customer_metadata"],
    supported_currencies: ["USD", "EUR", "GBP", "CAD", "AUD", "JPY"],
    supported_countries: ["US", "GB", "FR", "DE", "CA", "AU", "JP"],
    secret_key_env: "PSP_PADDLE_API_KEY",
    webhook_secret_env: "PSP_PADDLE_WEBHOOK_SECRET",
    docs_url: "https://developer.paddle.com",
    color: "#e91e63",
    logo_url: "https://cdn.simpleicons.org/paddle"
  },
  cinetpay: {
    key: "cinetpay",
    display_name: "CinetPay",
    description: "West and Central African payment gateway",
    capabilities: ["payment_links", "payment_creation", "payment_status", "webhooks", "customer_metadata"],
    supported_currencies: ["XOF", "XAF", "USD", "EUR", "GHS", "NGN"],
    supported_countries: ["CI", "SN", "CM", "BF", "ML", "BJ", "TG", "NE", "GA", "CG"],
    secret_key_env: "PSP_CINETPAY_API_KEY",
    site_id_env: "PSP_CINETPAY_SITE_ID",
    webhook_secret_env: "PSP_CINETPAY_WEBHOOK_SECRET",
    docs_url: "https://docs.cinetpay.com",
    color: "#f04e26",
    logo_url: ""
  }
};
function getPSPProvider(key) {
  return PSP_PROVIDERS[key];
}
function isPSPSecretSet(providerKey) {
  const provider = PSP_PROVIDERS[providerKey];
  if (!provider) return false;
  return !!secrets.get(provider.secret_key_env);
}
function getSecretHint(providerKey) {
  const provider = PSP_PROVIDERS[providerKey];
  if (!provider) return "";
  const val = secrets.get(provider.secret_key_env);
  if (!val) return "";
  return `****${val.slice(-4)}`;
}
function makeHint(value) {
  if (!value) return "";
  return `****${value.slice(-4)}`;
}
async function getPSPSecretFromDB(providerKey, repo) {
  const provider = PSP_PROVIDERS[providerKey];
  if (!provider) return { secretKey: null, siteId: null };
  const existing = await repo.filter({ provider: providerKey, environment: "production" });
  const row = existing[0];
  const dbSecret = row?.secret_value || null;
  const platformSecret = secrets.get(provider.secret_key_env);
  const secretKey = dbSecret || platformSecret || null;
  let siteId = null;
  if (providerKey === "cinetpay") {
    siteId = row?.site_id_value || secrets.get("PSP_CINETPAY_SITE_ID") || null;
  }
  return { secretKey, siteId };
}
const LINK_CREATION_SUPPORTED = /* @__PURE__ */ new Set(["stripe", "paystack", "flutterwave", "korapay", "cinetpay"]);
async function createPaymentLink(providerKey, params, options) {
  const provider = PSP_PROVIDERS[providerKey];
  if (!provider) throw new Error(`Unknown PSP provider: ${providerKey}`);
  const secretKey = options?.secretKey || secrets.get(provider.secret_key_env);
  if (!secretKey) throw new Error(`${provider.secret_key_env} is not configured. Set it in the PSP Center or Settings \u2192 Secrets.`);
  switch (providerKey) {
    case "stripe":
      return await createStripeLink(secretKey, params);
    case "paystack":
      return await createPaystackLink(secretKey, params);
    case "flutterwave":
      return await createFlutterwaveLink(secretKey, params);
    case "korapay":
      return await createKorapayLink(secretKey, params);
    case "cinetpay":
      return await createCinetPayLink(secretKey, params, options?.siteId);
    default:
      throw new Error(`${provider.display_name} API integration is not yet implemented. Configure the secret and contact support to enable it.`);
  }
}
async function createStripeLink(secretKey, p) {
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      "mode": "payment",
      "payment_method_types[0]": "card",
      "line_items[0][price_data][currency]": p.currency.toLowerCase(),
      "line_items[0][price_data][product_data][name]": p.description || "Payment",
      "line_items[0][price_data][unit_amount]": String(Math.round(p.amount * 100)),
      "line_items[0][quantity]": "1",
      "customer_email": p.customer_email || "",
      ...p.reference ? { "client_reference_id": p.reference } : {},
      "success_url": `${p.metadata?.success_url || "https://liafrik.com"}/success`,
      "cancel_url": `${p.metadata?.cancel_url || "https://liafrik.com"}/cancel`
    })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Stripe API error: ${err.slice(0, 300)}`);
  }
  const data = await res.json();
  return { link_url: data.url, provider_reference: data.id };
}
async function createPaystackLink(secretKey, p) {
  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${secretKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: p.customer_email,
      amount: Math.round(p.amount * 100),
      // Paystack uses kobo
      currency: p.currency,
      reference: p.reference,
      callback_url: p.metadata?.callback_url || "https://liafrik.com",
      metadata: { custom_fields: [{ display_name: "Description", variable_name: "description", value: p.description }] }
    })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Paystack API error: ${err.slice(0, 300)}`);
  }
  const data = await res.json();
  return { link_url: data.data.authorization_url, provider_reference: data.data.reference };
}
async function createFlutterwaveLink(secretKey, p) {
  const res = await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${secretKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      tx_ref: p.reference || `flw_${Date.now()}`,
      amount: p.amount,
      currency: p.currency,
      customer: { email: p.customer_email, name: p.customer_name || void 0 },
      customizations: { title: p.description || "Payment" },
      redirect_url: p.metadata?.callback_url || "https://liafrik.com"
    })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Flutterwave API error: ${err.slice(0, 300)}`);
  }
  const data = await res.json();
  return { link_url: data.data.link, provider_reference: data.data.tx_ref || p.reference };
}
async function createKorapayLink(secretKey, p) {
  const res = await fetch("https://api.korapay.com/merchant/api/v1/charges/initiate", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${secretKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      amount: p.amount,
      currency: p.currency,
      customer: { email: p.customer_email, name: p.customer_name || void 0 },
      description: p.description,
      reference: p.reference || `kor_${Date.now()}`,
      redirect_url: p.metadata?.callback_url || "https://liafrik.com"
    })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Korapay API error: ${err.slice(0, 300)}`);
  }
  const data = await res.json();
  return { link_url: data.data.checkout_url, provider_reference: data.data.reference };
}
async function createCinetPayLink(secretKey, p, siteIdOverride) {
  const siteId = siteIdOverride || secrets.get("PSP_CINETPAY_SITE_ID");
  if (!siteId) throw new Error("CinetPay Site ID is not configured. Set it in the PSP Center or Settings \u2192 Secrets.");
  const res = await fetch("https://api-checkout.cinetpay.com/v2/payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apikey: secretKey,
      site_id: siteId,
      trans_id: p.reference || `cnp_${Date.now()}`,
      amount: String(Math.round(p.amount)),
      currency: p.currency,
      designation: p.description || "Payment",
      buyer_name: p.customer_name || void 0,
      buyer_email: p.customer_email,
      return_url: p.metadata?.callback_url || "https://liafrik.com",
      notify_url: p.metadata?.notify_url || "https://liafrik.com"
    })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`CinetPay API error: ${err.slice(0, 300)}`);
  }
  const data = await res.json();
  if (data.status !== "accepted" || !data.data?.payment_url) {
    throw new Error(`CinetPay API error: ${JSON.stringify(data).slice(0, 300)}`);
  }
  return { link_url: data.data.payment_url, provider_reference: data.data.trans_id || p.reference };
}
// Verifies credentials with a real, read-only call to the provider — not just "is a value present".
// Korapay and CinetPay don't have a documented read-only endpoint usable here, so for those two
// this still only confirms a key is configured; connect()/test() label the result accordingly.
async function verifyPSPCredentials(providerKey, secretKey) {
  if (providerKey === "stripe") {
    const res = await fetch("https://api.stripe.com/v1/balance", { headers: { Authorization: `Bearer ${secretKey}` } });
    if (res.ok) return { verified: true };
    const err = await res.json().catch(() => ({}));
    return { verified: false, error: err?.error?.message || `Stripe rejected this key (HTTP ${res.status})` };
  }
  if (providerKey === "paystack") {
    const res = await fetch("https://api.paystack.co/balance", { headers: { Authorization: `Bearer ${secretKey}` } });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.status !== false) return { verified: true };
    return { verified: false, error: data?.message || `Paystack rejected this key (HTTP ${res.status})` };
  }
  if (providerKey === "flutterwave") {
    const res = await fetch("https://api.flutterwave.com/v3/balances", { headers: { Authorization: `Bearer ${secretKey}` } });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.status === "success") return { verified: true };
    return { verified: false, error: data?.message || `Flutterwave rejected this key (HTTP ${res.status})` };
  }
  return { verified: null };
}
export {
  PSP_PROVIDERS,
  LINK_CREATION_SUPPORTED,
  createPaymentLink,
  getPSPProvider,
  getPSPSecretFromDB,
  getSecretHint,
  isPSPSecretSet,
  makeHint,
  verifyPSPCredentials
};

export const WIZARD_STEPS = ['info', 'technical', 'capabilities', 'security', 'test', 'review'];

const isUrl = (v) => !v || /^https?:\/\/[^\s/]+\.[^\s]+$/.test(v);
const isDomain = (v) => !v || /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(v);
export const splitList = (v) => (v || '').split(',').map((s) => s.trim()).filter(Boolean);

export const PALETTE = ['#B8862F', '#2F5DB8', '#B83F6E', '#3E8E6A', '#6B4FB8', '#C4622D', '#1F7A8C', '#4B5563'];

export function validateStep(step, form, existingSlugs) {
  const e = {};
  if (step === 'info') {
    if (form.name.trim().length < 2) e.name = 'required';
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.slug)) e.slug = 'slug';
    else if (existingSlugs.includes(form.slug) || form.slug === 'new') e.slug = 'slugTaken';
    if (!isDomain(form.domain)) e.domain = 'domain';
    if (!isUrl(form.admin_url)) e.admin_url = 'url';
    if (!form.api_url) e.api_url = 'required';
    else if (!isUrl(form.api_url)) e.api_url = 'url';
  }
  if (step === 'technical') {
    if (!form.health_endpoint.startsWith('/')) e.health_endpoint = 'path';
    if (!form.api_version.trim()) e.api_version = 'required';
    if (!form.version.trim()) e.version = 'required';
  }
  if (step === 'capabilities' && form.capabilities.length === 0) e.capabilities = 'capabilities';
  if (step === 'security') {
    if (form.auth_method === 'api_key' && form.api_key.length < 12) e.api_key = 'apiKey';
    if (['oauth2', 'sso'].includes(form.auth_method) && !form.client_id.trim()) e.client_id = 'required';
    if (splitList(form.allowed_origins).some((o) => !isUrl(o))) e.allowed_origins = 'origins';
    if (!(Number(form.rate_limit) > 0)) e.rate_limit = 'rateLimit';
  }
  return e;
}
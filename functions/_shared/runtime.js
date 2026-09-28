// Per-request environment (Cloudflare bindings) exposed like a simple secrets store.
let currentEnv = {};
export const setEnv = (env) => { currentEnv = env || {}; };
export const getEnv = () => currentEnv;
export const secrets = { get: (name) => currentEnv[name] ?? null };

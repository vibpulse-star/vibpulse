// Secrets set with `wrangler secret put`; bindings/vars come from cloudflare-env.d.ts (`npm run cf-typegen`).
declare global {
  interface CloudflareEnv {
    STRIPE_SECRET_KEY: string;
    STRIPE_PRICE_ID: string;
    SESSION_SECRET: string;
    ACCESS_AUD: string;
    SKILL_SNAPSHOT_TOKEN: string;
    RESEND_API_KEY: string;
  }
}
export {};

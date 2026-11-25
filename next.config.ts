import type { NextConfig } from 'next';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

initOpenNextCloudflareForDev(); // gives `next dev` the D1 binding from wrangler.jsonc

const config: NextConfig = {};
export default config;

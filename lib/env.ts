import { getCloudflareContext } from '@opennextjs/cloudflare';

/** Worker bindings, vars and secrets for the current request. */
export const env = () => getCloudflareContext().env;

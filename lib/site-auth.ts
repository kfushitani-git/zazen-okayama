import { env } from 'cloudflare:workers';
import { headers } from 'next/headers';
import { getChatGPTUser } from '../app/chatgpt-auth';
import { resolveSiteIdentity } from './cloudflare-access.mjs';

export function authProvider() { return env.AUTH_PROVIDER || 'sites'; }
export async function getSiteUser() {
  return resolveSiteIdentity(await headers(), {
    provider: authProvider(), teamDomain: env.CF_ACCESS_TEAM_DOMAIN,
    audience: env.CF_ACCESS_AUD,
  }, getChatGPTUser);
}

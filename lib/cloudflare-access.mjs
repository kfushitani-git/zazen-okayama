import { createRemoteJWKSet, jwtVerify } from 'jose';

const keySets = new Map();
export function accessIssuer(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || !/^[a-z0-9][a-z0-9-]*\.cloudflareaccess\.com$/.test(url.hostname) || url.port || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Cloudflare Access team domain must be an HTTPS team.cloudflareaccess.com origin.');
  }
  return url.origin;
}

export function accessToken(headers) {
  const assertion = headers.get('cf-access-jwt-assertion');
  if (assertion) return assertion;
  // A public /media URL does not receive Access's injected header. The signed
  // HttpOnly Access cookie still lets the editor view private draft images.
  const cookies = (headers.get('cookie') || '').split(';').map(s => s.trim()).filter(s => s.startsWith('CF_Authorization='));
  if (cookies.length !== 1) return null;
  return cookies[0].slice('CF_Authorization='.length);
}

export async function verifyAccessIdentity(token, config, resolver) {
  try {
    if (!token || token.length > 16000 || !config.audience) return null;
    const issuer = accessIssuer(config.teamDomain);
    let jwks = resolver;
    if (!jwks) {
      jwks = keySets.get(issuer);
      if (!jwks) {
        jwks = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`), { timeoutDuration: 5000, cooldownDuration: 30000, cacheMaxAge: 300000 });
        keySets.set(issuer, jwks);
      }
    }
    const { payload } = await jwtVerify(token, jwks, {
      algorithms: ['RS256'], issuer, audience: config.audience,
      requiredClaims: ['iss','aud','exp','iat','sub','email','type'],
    });
    if (payload.type !== 'app' || typeof payload.email !== 'string' || !/^[^\s@]+@[^\s@]+$/.test(payload.email) || typeof payload.sub !== 'string' || !payload.sub) return null;
    return { userId: payload.sub, email: payload.email, displayName: payload.email, fullName: null };
  } catch { return null; }
}

export async function resolveSiteIdentity(headers, config, sitesIdentity, resolver) {
  if (!config.provider || config.provider === 'sites') return sitesIdentity();
  if (config.provider !== 'cloudflare-access') return null;
  // Never fall back to unverified email or oai-* headers in standalone mode.
  return verifyAccessIdentity(accessToken(headers), config, resolver);
}

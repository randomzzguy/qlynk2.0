import dns from 'node:dns/promises';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';

export const MAX_REDIRECTS = 5;
export const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
export const REQUEST_TIMEOUT_MS = 15_000;

const blockedIpv4 = new net.BlockList();
[
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
].forEach(([address, prefix]) => blockedIpv4.addSubnet(address, prefix, 'ipv4'));

const blockedIpv6 = new net.BlockList();
[
  ['::', 128],
  ['::1', 128],
  ['::ffff:0:0', 96],
  ['64:ff9b::', 96],
  ['100::', 64],
  ['2001:db8::', 32],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
].forEach(([address, prefix]) => blockedIpv6.addSubnet(address, prefix, 'ipv6'));

export class SafeFetchError extends Error {
  constructor(message, code = 'SAFE_FETCH_FAILED') {
    super(message);
    this.name = 'SafeFetchError';
    this.code = code;
  }
}

function normalizeHostname(hostname) {
  return hostname.startsWith('[') && hostname.endsWith(']')
    ? hostname.slice(1, -1)
    : hostname;
}

export function isPublicIp(address) {
  const family = net.isIP(address);
  if (family === 4) return !blockedIpv4.check(address, 'ipv4');
  if (family === 6) return !blockedIpv6.check(address, 'ipv6');
  return false;
}

export async function resolvePublicTarget(target, lookup = dns.lookup) {
  const parsed = target instanceof URL ? target : new URL(target);

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new SafeFetchError('Only http and https URLs are allowed.', 'INVALID_PROTOCOL');
  }

  if (parsed.username || parsed.password) {
    throw new SafeFetchError('URLs containing credentials are not allowed.', 'URL_CREDENTIALS');
  }

  const hostname = normalizeHostname(parsed.hostname).toLowerCase();
  if (!hostname || hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local')) {
    throw new SafeFetchError('Local addresses are not allowed.', 'PRIVATE_TARGET');
  }

  const literalFamily = net.isIP(hostname);
  const addresses = literalFamily
    ? [{ address: hostname, family: literalFamily }]
    : await lookup(hostname, { all: true, verbatim: true });

  if (!addresses?.length) {
    throw new SafeFetchError('Could not resolve host.', 'DNS_FAILED');
  }

  if (addresses.some(({ address }) => !isPublicIp(address))) {
    throw new SafeFetchError('Private or internal hosts are not allowed.', 'PRIVATE_TARGET');
  }

  // The request lookup below returns this exact address, so the network
  // connection cannot perform a second DNS lookup and rebind to another host.
  return { parsed, address: addresses[0].address, family: Number(addresses[0].family) };
}

export function readLimitedBody(response, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let receivedBytes = 0;

    response.on('data', (chunk) => {
      receivedBytes += chunk.length;
      if (receivedBytes > maxBytes) {
        response.destroy();
        reject(new SafeFetchError('Website response is too large.', 'RESPONSE_TOO_LARGE'));
        return;
      }
      chunks.push(chunk);
    });
    response.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    response.on('error', reject);
  });
}

function requestPinnedUrl(resolved, { headers, timeoutMs, maxBytes }) {
  const { parsed, address, family } = resolved;
  const transport = parsed.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const request = transport.request(parsed, {
      headers,
      lookup(_hostname, lookupOptions, callback) {
        if (lookupOptions?.all) {
          callback(null, [{ address, family }]);
          return;
        }
        callback(null, address, family);
      },
      servername: parsed.protocol === 'https:' ? normalizeHostname(parsed.hostname) : undefined,
      timeout: timeoutMs,
    }, async (response) => {
      try {
        const body = await readLimitedBody(response, maxBytes);
        resolve({
          status: response.statusCode || 0,
          headers: response.headers,
          body,
        });
      } catch (error) {
        reject(error);
      }
    });

    request.on('timeout', () => {
      request.destroy(new SafeFetchError('Website request timed out.', 'REQUEST_TIMEOUT'));
    });
    request.on('error', reject);
    request.end();
  });
}

// Exported for transport-level regression tests. Production callers should use
// fetchPublicText so target validation and redirect checks cannot be skipped.
export const requestPinnedUrlForTest = requestPinnedUrl;

export async function fetchPublicText(initialUrl, options = {}) {
  const {
    headers = {},
    lookup = dns.lookup,
    request = requestPinnedUrl,
    maxRedirects = MAX_REDIRECTS,
    maxBytes = MAX_RESPONSE_BYTES,
    timeoutMs = REQUEST_TIMEOUT_MS,
  } = options;

  let currentUrl = initialUrl instanceof URL ? initialUrl : new URL(initialUrl);

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
    const resolved = await resolvePublicTarget(currentUrl, lookup);
    const response = await request(resolved, { headers, timeoutMs, maxBytes });

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.location;
      if (!location) {
        throw new SafeFetchError('Website returned an invalid redirect.', 'INVALID_REDIRECT');
      }
      if (redirectCount === maxRedirects) {
        throw new SafeFetchError('Website redirected too many times.', 'TOO_MANY_REDIRECTS');
      }
      currentUrl = new URL(location, currentUrl);
      continue;
    }

    return { ...response, url: currentUrl.toString() };
  }

  throw new SafeFetchError('Website redirected too many times.', 'TOO_MANY_REDIRECTS');
}

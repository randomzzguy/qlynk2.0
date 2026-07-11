import assert from 'node:assert/strict';
import http from 'node:http';
import { Readable } from 'node:stream';
import test from 'node:test';
import {
  fetchPublicText,
  isPublicIp,
  readLimitedBody,
  resolvePublicTarget,
  SafeFetchError,
} from '../lib/safe-public-fetch.js';

test('IP classification blocks internal, reserved, mapped, and documentation ranges', () => {
  const blocked = [
    '0.0.0.0',
    '10.0.0.1',
    '100.64.0.1',
    '127.0.0.1',
    '169.254.169.254',
    '172.16.0.1',
    '192.168.1.1',
    '198.18.0.1',
    '224.0.0.1',
    '::',
    '::1',
    '::ffff:127.0.0.1',
    'fc00::1',
    'fe80::1',
    'ff00::1',
    '2001:db8::1',
  ];

  blocked.forEach((address) => assert.equal(isPublicIp(address), false, address));
  assert.equal(isPublicIp('8.8.8.8'), true);
  assert.equal(isPublicIp('2606:4700:4700::1111'), true);
});

test('URL validation rejects local names, credentials, and non-http protocols', async () => {
  const rejected = [
    'http://localhost/',
    'http://service.local/',
    'http://user:password@example.com/',
    'file:///etc/passwd',
  ];

  for (const url of rejected) {
    await assert.rejects(resolvePublicTarget(url), SafeFetchError);
  }
});

test('mixed public and private DNS answers are rejected', async () => {
  const lookup = async () => [
    { address: '8.8.8.8', family: 4 },
    { address: '127.0.0.1', family: 4 },
  ];

  await assert.rejects(
    resolvePublicTarget('https://example.test/', lookup),
    (error) => error.code === 'PRIVATE_TARGET'
  );
});

test('the HTTP request receives the exact DNS address that was validated', async () => {
  let lookupCalls = 0;
  let connectedAddress;
  const lookup = async () => {
    lookupCalls += 1;
    return [{ address: '8.8.8.8', family: 4 }];
  };
  const request = async (resolved) => {
    connectedAddress = resolved.address;
    return {
      status: 200,
      headers: { 'content-type': 'text/plain' },
      body: 'public response',
    };
  };

  await fetchPublicText('https://example.test/', { lookup, request });
  assert.equal(lookupCalls, 1);
  assert.equal(connectedAddress, '8.8.8.8');
});

test('every redirect is validated before the next request', async () => {
  const requested = [];
  const lookup = async (hostname) => [{
    address: hostname === 'safe.test' ? '8.8.8.8' : '127.0.0.1',
    family: 4,
  }];
  const request = async (resolved) => {
    requested.push(resolved.parsed.toString());
    return {
      status: 302,
      headers: { location: 'http://internal.test/secret' },
      body: '',
    };
  };

  await assert.rejects(
    fetchPublicText('https://safe.test/', { lookup, request }),
    (error) => error.code === 'PRIVATE_TARGET'
  );
  assert.deepEqual(requested, ['https://safe.test/']);
});

test('relative redirects work and redirect loops stop at the configured limit', async () => {
  let requestCount = 0;
  const lookup = async () => [{ address: '8.8.8.8', family: 4 }];
  const request = async () => {
    requestCount += 1;
    return { status: 302, headers: { location: '/again' }, body: '' };
  };

  await assert.rejects(
    fetchPublicText('https://safe.test/start', { lookup, request, maxRedirects: 2 }),
    (error) => error.code === 'TOO_MANY_REDIRECTS'
  );
  assert.equal(requestCount, 3);
});

test('response streaming aborts when the byte limit is exceeded', async () => {
  const response = Readable.from([Buffer.alloc(6), Buffer.alloc(6)]);
  await assert.rejects(
    readLimitedBody(response, 10),
    (error) => error.code === 'RESPONSE_TOO_LARGE'
  );
});

test('response streaming returns text within the byte limit', async () => {
  const response = Readable.from([Buffer.from('hello '), Buffer.from('world')]);
  assert.equal(await readLimitedBody(response, 20), 'hello world');
});

test('pinned transport supports Node all-address lookup requests', async () => {
  const server = http.createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'text/plain' });
    response.end('transport works');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

  try {
    const { port } = server.address();
    const requestPinnedUrl = async (resolved, options) => {
      // Substitute a loopback endpoint only after public-target validation.
      // This exercises the real transport callback without weakening validation.
      const safeFetchModule = await import('../lib/safe-public-fetch.js');
      return safeFetchModule.requestPinnedUrlForTest({
        ...resolved,
        parsed: new URL(`http://transport.test:${port}/`),
        address: '127.0.0.1',
        family: 4,
      }, options);
    };
    const response = await fetchPublicText('http://transport.test/', {
      lookup: async () => [{ address: '8.8.8.8', family: 4 }],
      request: requestPinnedUrl,
    });
    assert.equal(response.body, 'transport works');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

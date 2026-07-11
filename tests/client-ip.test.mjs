import assert from 'node:assert/strict';
import test from 'node:test';
import { getRateLimitIdentifier } from '../lib/client-ip.js';

function request(headers) {
  const normalized = new Map(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]));
  return { headers: { get: (name) => normalized.get(name.toLowerCase()) || null } };
}

test('Vercel-owned client IP takes priority over ordinary forwarding headers', () => {
  assert.equal(getRateLimitIdentifier(request({
    'x-vercel-forwarded-for': '203.0.113.10',
    'x-forwarded-for': '198.51.100.2',
  })), 'ip:203.0.113.10');
});

test('invalid spoofed values are ignored in favor of a valid fallback header', () => {
  assert.equal(getRateLimitIdentifier(request({
    'x-vercel-forwarded-for': 'not-an-ip',
    'x-forwarded-for': 'also-invalid',
    'x-real-ip': '2001:4860:4860::8888',
  })), 'ip:2001:4860:4860::8888');
});

test('unidentified clients receive a stable bounded fallback identifier', () => {
  const identifier = getRateLimitIdentifier(request({ 'user-agent': 'test-agent' }));
  assert.equal(identifier, 'unknown:test-agent');
});

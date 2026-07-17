const baseUrl = (process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3100').replace(/\/$/, '');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: 'manual', ...options });
  const body = await response.text();
  return { response, body };
}

const publicRoutes = ['/', '/pricing', '/faq', '/privacy', '/terms', '/blog'];
for (const path of publicRoutes) {
  const { response, body } = await request(path);
  assert(response.status === 200, `${path} returned ${response.status}`);
  assert(body.includes('<html'), `${path} did not return HTML`);
}

const dashboard = await request('/dashboard');
assert([307, 308].includes(dashboard.response.status), `Unauthenticated dashboard returned ${dashboard.response.status}`);
assert(new URL(dashboard.response.headers.get('location'), baseUrl).pathname === '/auth/login', 'Dashboard did not redirect to login');

const removedRoute = await request('/todos');
assert(removedRoute.response.status === 404, `/todos returned ${removedRoute.response.status}`);

const health = await request('/api/health');
assert(health.response.status === 200, `Public health returned ${health.response.status}`);
assert(JSON.stringify(JSON.parse(health.body)) === JSON.stringify({ status: 'ok' }), 'Public health leaked detailed diagnostics');

for (const path of ['/api/status', '/api/errors']) {
  const result = await request(path);
  if (path === '/api/status') {
    assert(result.response.status === 200, `${path} returned ${result.response.status}`);
    assert(JSON.stringify(JSON.parse(result.body)) === JSON.stringify({ status: 'ok' }), `${path} leaked diagnostics`);
  } else {
    assert(result.response.status === 401, `${path} did not require diagnostics authorization`);
  }
}

const privateRules = await request('/api/agent/rules');
assert(privateRules.response.status === 401, '/api/agent/rules did not require owner authentication');

const homepage = await request('/');
const csp = homepage.response.headers.get('content-security-policy') || '';
assert(csp.includes("frame-ancestors 'none'"), 'Homepage CSP does not deny framing');
assert(!csp.includes("'unsafe-eval'"), 'Production CSP still permits unsafe-eval');
assert(homepage.response.headers.get('x-frame-options') === 'DENY', 'Homepage lacks X-Frame-Options DENY');
assert(homepage.response.headers.get('x-content-type-options') === 'nosniff', 'Homepage lacks nosniff');

const embed = await request('/embed/nonexistent');
const embedCsp = embed.response.headers.get('content-security-policy') || '';
assert(embedCsp.includes('frame-ancestors *'), 'Embed CSP does not permit intended framing');
assert(!embed.response.headers.has('x-frame-options'), 'Embed has a conflicting X-Frame-Options header');

const sitemap = await request('/sitemap.xml');
assert(sitemap.response.status === 200, 'Sitemap is unavailable');
for (const path of ['/pricing', '/blog', '/for-job-seekers', '/privacy', '/terms']) {
  assert(sitemap.body.includes(`https://www.qlynk.site${path}`), `Sitemap is missing ${path}`);
}

const robots = await request('/robots.txt');
assert(robots.response.status === 200, 'robots.txt is unavailable');
assert(robots.body.includes('Disallow: /api/'), 'robots.txt does not disallow API crawling');
assert(robots.body.includes('https://www.qlynk.site/sitemap.xml'), 'robots.txt has the wrong sitemap');

console.log(`HTTP production smoke passed against ${baseUrl}: public routes, auth redirect, 404, diagnostics, security headers, embed policy, sitemap, and robots.`);

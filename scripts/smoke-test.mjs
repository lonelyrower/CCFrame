const baseUrl = process.env.SMOKE_BASE_URL || process.env.BASE_URL || 'http://localhost:3000';
const adminEmail = process.env.SMOKE_ADMIN_EMAIL || process.env.ADMIN_EMAIL || '';
const adminPassword = process.env.SMOKE_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '';

function url(pathname) {
  return new URL(pathname, baseUrl).toString();
}

async function expectStatus(res, expected, label) {
  if (Array.isArray(expected)) {
    if (!expected.includes(res.status)) {
      throw new Error(`${label} expected ${expected.join(', ')} got ${res.status}`);
    }
    return;
  }
  if (res.status !== expected) {
    throw new Error(`${label} expected ${expected} got ${res.status}`);
  }
}

async function fetchJson(pathname, options, expectedStatus) {
  const res = await fetch(url(pathname), options);
  await expectStatus(res, expectedStatus, pathname);
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('json')) {
    throw new Error(`${pathname} expected JSON got ${contentType}`);
  }
  return res.json();
}

async function fetchText(pathname, options, expectedStatus, expectedType) {
  const res = await fetch(url(pathname), options);
  await expectStatus(res, expectedStatus, pathname);
  if (expectedType) {
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes(expectedType)) {
      throw new Error(`${pathname} expected ${expectedType} got ${contentType}`);
    }
  }
  return res.text();
}

async function login() {
  const res = await fetch(url('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  });
  await expectStatus(res, 200, '/api/auth/login');
  const cookie = res.headers.get('set-cookie');
  if (!cookie) {
    throw new Error('Missing session cookie on login');
  }
  return cookie.split(';')[0];
}

async function runCheck(name, fn, results) {
  try {
    await fn();
    results.push({ name, ok: true });
  } catch (error) {
    results.push({ name, ok: false, error });
  }
}

async function main() {
  const results = [];

  await runCheck('Public HTML', async () => {
    await fetchText('/', {}, 200, 'text/html');
  }, results);

  await runCheck('Manifest', async () => {
    await fetchJson('/manifest.json', {}, 200);
  }, results);

  await runCheck('Service worker', async () => {
    await fetchText('/sw.js', {}, 200, 'javascript');
  }, results);

  await runCheck('Public tags', async () => {
    await fetchJson('/api/tags', {}, 200);
  }, results);

  await runCheck('Public series', async () => {
    await fetchJson('/api/series', {}, 200);
  }, results);

  await runCheck('Public site copy', async () => {
    await fetchJson('/api/site-copy', {}, 200);
  }, results);

  await runCheck('Public photos (explicit)', async () => {
    await fetchJson('/api/photos?isPublic=true', {}, 200);
  }, results);

  await runCheck('Public photos (no flag)', async () => {
    const res = await fetch(url('/api/photos'));
    await expectStatus(res, 401, '/api/photos');
  }, results);

  await runCheck('Metrics summary unauth', async () => {
    const res = await fetch(url('/api/metrics/summary'));
    await expectStatus(res, 401, '/api/metrics/summary');
  }, results);

  let sessionCookie = '';
  if (adminEmail && adminPassword) {
    await runCheck('Login', async () => {
      sessionCookie = await login();
    }, results);

    if (sessionCookie) {
      const authHeaders = { cookie: sessionCookie };
      await runCheck('Auth session', async () => {
        await fetchJson('/api/auth/session', { headers: authHeaders }, 200);
      }, results);

      await runCheck('Metrics summary auth', async () => {
        await fetchJson('/api/metrics/summary', { headers: authHeaders }, 200);
      }, results);

      await runCheck('Photos auth', async () => {
        await fetchJson('/api/photos', { headers: authHeaders }, 200);
      }, results);
    }
  } else {
    results.push({ name: 'Auth checks (skipped)', ok: true });
  }

  const failed = results.filter((result) => !result.ok);
  for (const result of results) {
    if (result.ok) {
      console.log(`PASS: ${result.name}`);
    } else {
      console.error(`FAIL: ${result.name} - ${result.error.message}`);
    }
  }

  if (failed.length) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

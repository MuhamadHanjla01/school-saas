// Run after building: node tests/account-switch.cjs dist [--pending|--expired]
// Uses Playwright from the test environment; no live backend or accounts needed.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

(async () => {
  const build = path.resolve(process.argv[2] || 'dist');
  const pending = process.argv.includes('--pending');
  const expired = process.argv.includes('--expired');
  let releaseOldRequest;
  let oldRequestStarted;
  const oldStarted = new Promise(resolve => { oldRequestStarted = resolve; });
  const oldResponse = new Promise(resolve => { releaseOldRequest = resolve; });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    let account = null;
    let dashboardRequests = 0;
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.origin !== 'http://school.test') return route.abort();
      const reply = (json, status = 200) => route.fulfill({ status, json });
      if (url.pathname === '/api/auth/refresh') return reply({ error: 'No session' }, 401);
      if (url.pathname === '/api/auth/login') {
        account = route.request().postDataJSON().email.split('@')[0];
        return reply({ accessToken: account, user: { id: account, name: account, role: 'Teacher', schoolId: account }, school: { id: account, name: account } });
      }
      if (url.pathname === '/api/auth/logout') { account = null; return reply({}); }
      if (url.pathname === '/api/teachers/me/profile') return reply({ teacher: { name: account, subjectNames: [] } });
      if (url.pathname === '/api/teachers/me/dashboard') {
        dashboardRequests++;
        const owner = account;
        if (pending && owner === 'Alice') { oldRequestStarted(); await oldResponse; }
        return reply({ subjectNames: [`Private subject for ${owner}`], recentAssignments: [], upcomingClasses: [] });
      }
      if (expired && url.pathname === '/api/classes' && account === 'Alice') return reply({ error: 'Session expired' }, 401);
      if (url.pathname.startsWith('/api/')) return reply({});
      let file = path.join(build, url.pathname);
      if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(build, 'index.html');
      const contentType = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' }[path.extname(file)] || 'application/octet-stream';
      await route.fulfill({ body: fs.readFileSync(file), contentType });
    });
    await page.goto('http://school.test/login');
    const login = async name => {
      await page.locator('input[type=email]').fill(`${name}@example.test`);
      await page.locator('input[type=password]').fill('TestPassword123');
      await page.locator('button[type=submit]').click();
      await page.getByText(`Welcome, ${name}`, { exact: true }).waitFor();
    };
    await login('Alice');
    if (pending) await oldStarted;
    else await page.getByText('Private subject for Alice', { exact: true }).waitFor();
    if (expired) {
      await page.getByRole('button', { name: /Teaching/ }).click();
      await page.getByRole('button', { name: 'My Classes', exact: true }).click();
    } else await page.getByRole('button', { name: 'Sign Out' }).click();
    await login('Bob');
    releaseOldRequest();
    const leaked = await page.getByText('Private subject for Alice', { exact: true }).count();
    assert.equal(leaked, 0, 'Bob must never see Alice cached subject data');
    await page.getByText('Private subject for Bob', { exact: true }).waitFor({ timeout: 3000 });
    assert.equal(await page.getByText('Private subject for Alice', { exact: true }).count(), 0);
    assert.equal(dashboardRequests, 2);
    assert.deepEqual(errors, []);
    console.log(`PASS (${pending ? 'pending request' : expired ? 'expired session' : 'logout'}): Bob gets fresh data, Alice data is absent, no browser exceptions.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

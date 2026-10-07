const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const ts = require('typescript');
const jwt = require('jsonwebtoken');

// Load the real TypeScript implementation with isolated Stripe/database adapters.
// These tests never read credentials or contact Stripe/MongoDB.
function loadModule(relativePath, dependencies) {
  const filename = path.join(__dirname, '..', relativePath);
  const javascript = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  const requireMock = (name) => {
    assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`);
    return dependencies[name];
  };
  vm.runInNewContext('(function(require, module, exports) {\n' + javascript + '\n})', { URL }, { filename })(requireMock, module, module.exports);
  return module.exports;
}

function serviceHarness({ user = { email: 'seller@example.test', stripeAccountId: 'acct_existing', save: async () => {} }, account = {} } = {}) {
  const calls = { create: [], retrieve: [], links: [], dashboards: [] };
  const config = { stripe: { secretKey: 'unused-test-key' }, frontendUrl: 'https://example.test/' };
  const accountState = {
    details_submitted: true,
    charges_enabled: true,
    payouts_enabled: true,
    requirements: { currently_due: [], past_due: [], pending_verification: [] },
    ...account,
  };
  const stripe = {
    accounts: {
      create: async (...args) => { calls.create.push(args); return { id: 'acct_new' }; },
      retrieve: async (id) => { calls.retrieve.push(id); return accountState; },
      createLoginLink: async (id) => { calls.dashboards.push(id); return { url: 'https://connect.stripe.com/express/example' }; },
    },
    accountLinks: { create: async (parameters) => { calls.links.push(parameters); return { url: `https://connect.stripe.com/setup/${calls.links.length}` }; } },
  };
  class AppError extends Error { constructor(statusCode, message) { super(message); this.statusCode = statusCode; } }
  const { userService } = loadModule('src/app/modules/user/user.service.ts', {
    stripe: class Stripe { constructor() { return stripe; } },
    '../../config': config,
    '../../error/appError': AppError,
    '../../helper/fileUploder': {},
    '../../helper/pagenation': {},
    './user.model': { findById: () => Object.assign(Promise.resolve(user), { select: () => Promise.resolve(user) }) },
    '../assigment/assigment.model': {},
    '../course/course.model': {},
  });
  return { service: userService, calls, user, account: accountState, config };
}

test('an account ID alone does not mark onboarding complete', async () => {
  const { service, calls } = serviceHarness({ account: { details_submitted: false, charges_enabled: false, payouts_enabled: false } });
  const status = await service.getStripeAccountStatus('seller-id');
  assert.equal(status.hasAccount, true);
  assert.equal(status.detailsSubmitted, false);
  assert.equal(status.needsMoreInformation, true);
  assert.equal(status.payoutsEnabled, false);
  assert.deepEqual(calls.retrieve, ['acct_existing']);
});

test('a disconnected user is reported without making a Stripe request', async () => {
  const { service, calls } = serviceHarness({ user: { email: 'seller@example.test' } });
  const status = await service.getStripeAccountStatus('seller-id');
  assert.equal(status.hasAccount, false);
  assert.equal(status.detailsSubmitted, false);
  assert.equal(status.payoutsEnabled, false);
  assert.equal(status.needsMoreInformation, false);
  assert.equal(calls.retrieve.length, 0);
});

test('verification pending does not falsely enable payouts', async () => {
  const { service } = serviceHarness({ account: { payouts_enabled: false, requirements: { currently_due: [], past_due: [], pending_verification: ['individual.verification.document'] } } });
  const status = await service.getStripeAccountStatus('seller-id');
  assert.equal(status.detailsSubmitted, true);
  assert.equal(status.payoutsEnabled, false);
  assert.equal(status.verificationPending, true);
  assert.equal(status.needsMoreInformation, false);
});

test('current and past due requirements require a continuation even after details are submitted', async () => {
  for (const dueField of ['currently_due', 'past_due']) {
    const { service } = serviceHarness({ account: { requirements: { [dueField]: ['external_account'] } } });
    assert.equal((await service.getStripeAccountStatus('seller-id')).needsMoreInformation, true);
  }
});

test('verified Stripe flags are returned without private account details', async () => {
  const { service } = serviceHarness();
  assert.deepEqual({ ...await service.getStripeAccountStatus('seller-id') }, {
    hasAccount: true, detailsSubmitted: true, chargesEnabled: true, payoutsEnabled: true,
    needsMoreInformation: false, verificationPending: false,
  });
});

test('expired-link retries create fresh links for the same account with valid callback paths', async () => {
  const { service, calls } = serviceHarness();
  const first = await service.createStripeAccount('seller-id');
  const second = await service.createStripeAccount('seller-id');
  assert.notEqual(first.url, second.url);
  assert.equal(calls.create.length, 0);
  for (const link of calls.links) {
    assert.equal(link.account, 'acct_existing');
    assert.equal(link.type, 'account_onboarding');
    assert.equal(link.return_url, 'https://example.test/stripe-account-success');
    assert.equal(link.refresh_url, 'https://example.test/connect/refresh');
  }
});

test('first-time creation uses a stable idempotency key and persists the account before creating its link', async () => {
  let savedAccount;
  const user = { email: 'seller@example.test', save: async function () { savedAccount = this.stripeAccountId; } };
  const { service, calls } = serviceHarness({ user });
  await service.createStripeAccount('seller-id');
  assert.equal(savedAccount, 'acct_new');
  assert.equal(calls.create[0][1].idempotencyKey, 'connect-account-seller-id');
  assert.equal(calls.create[0][0].business_profile, undefined);
  assert.equal(calls.links[0].account, 'acct_new');
});

test('opening a dashboard for an incomplete account resumes onboarding', async () => {
  const { service, calls } = serviceHarness({ account: { details_submitted: false } });
  const result = await service.getStripeDashboardLink('seller-id');
  assert.equal(result.url, 'https://connect.stripe.com/setup/1');
  assert.equal(calls.dashboards.length, 0);
  assert.equal(calls.links.length, 1);
});

test('submitted account holders receive an Express dashboard login link', async () => {
  const { service, calls } = serviceHarness();
  const result = await service.getStripeDashboardLink('seller-id');
  assert.equal(result.url, 'https://connect.stripe.com/express/example');
  assert.deepEqual(calls.dashboards, ['acct_existing']);
  assert.equal(calls.links.length, 0);
});

test('missing users and missing frontend configuration fail without creating a Stripe account', async () => {
  const missingUser = serviceHarness({ user: null });
  await assert.rejects(missingUser.service.getStripeAccountStatus('missing-id'), { statusCode: 404 });
  const unconfigured = serviceHarness({ user: { email: 'seller@example.test', save: async () => {} } });
  unconfigured.config.frontendUrl = undefined;
  await assert.rejects(unconfigured.service.createStripeAccount('seller-id'), { statusCode: 500 });
  assert.equal(unconfigured.calls.create.length, 0);
});

test('the account status route requires an authenticated business or sales user before the dynamic ID route', () => {
  const routes = [];
  const router = Object.fromEntries(['get', 'post', 'put', 'delete'].map((method) => [method, (url, ...handlers) => { routes.push({ method, url, handlers }); }]));
  const controller = { getStripeAccountStatus: () => {} };
  loadModule('src/app/modules/user/user.routes.ts', {
    express: { Router: () => router },
    './user.controller': { userController: controller },
    '../../middlewares/auth': (...roles) => ({ roles }),
    '../../helper/fileUploder': { fileUploader: { upload: { single: () => () => {} } } },
    './user.constant': { userRole: { admin: 'admin', business: 'business', seles: 'seles' } },
  });
  const index = routes.findIndex((route) => route.url === '/stripe-account-status');
  assert.ok(index >= 0 && index < routes.findIndex((route) => route.url === '/:id'));
  assert.deepEqual(routes[index].handlers[0].roles, ['business', 'seles']);
  assert.equal(routes[index].handlers[1], controller.getStripeAccountStatus);
});

test('the status controller uses the authenticated ID and disables response caching', async () => {
  let requestedId;
  let sentResponse;
  const { userController } = loadModule('src/app/modules/user/user.controller.ts', {
    '../../utils/catchAsycn': (handler) => handler,
    '../../utils/sendResponse': (response, payload) => { sentResponse = payload; },
    '../../helper/pick': {},
    './user.service': { userService: { getStripeAccountStatus: async (id) => { requestedId = id; return { hasAccount: false }; } } },
  });
  const headers = {};
  await userController.getStripeAccountStatus({ user: { id: 'authenticated-user' }, params: { id: 'other-user' } }, { setHeader: (name, value) => { headers[name] = value; } });
  assert.equal(requestedId, 'authenticated-user');
  assert.equal(headers['Cache-Control'], 'no-store');
  assert.equal(sentResponse.success, true);
  assert.equal(sentResponse.data.hasAccount, false);
});

function authHarness(databaseError) {
  const secret = 'local-auth-test-secret';
  let databaseCalls = 0;
  class AppError extends Error { constructor(statusCode, message) { super(message); this.statusCode = statusCode; } }
  const { default: auth } = loadModule('src/app/middlewares/auth.ts', {
    jsonwebtoken: jwt,
    '../error/appError': AppError,
    '../config': { jwt: { accessTokenSecret: secret } },
    '../helper/jwtHelpers': { jwtHelpers: { verifyToken: (token, key) => jwt.verify(token, key) } },
    '../modules/user/user.model': { findById: () => {
      databaseCalls += 1;
      return { select: async () => {
        if (databaseError) throw databaseError;
        return { _id: { toString: () => 'seller-id' }, role: 'seles', status: 'approved', verified: true };
      } };
    } },
  });
  return { middleware: auth('business', 'seles'), secret, databaseCalls: () => databaseCalls };
}

test('expired, invalid-signature, and not-yet-valid JWTs return 401 so the callback can resume after signing in', async () => {
  for (const tokenKind of ['expired', 'invalid-signature', 'not-yet-valid']) {
    const harness = authHarness();
    const options = tokenKind === 'expired' ? { expiresIn: -1 } : tokenKind === 'not-yet-valid' ? { notBefore: '1h' } : { expiresIn: '1h' };
    const token = jwt.sign({ id: 'seller-id', role: 'seles' }, tokenKind === 'invalid-signature' ? 'different-test-secret' : harness.secret, options);
    let nextError;
    await harness.middleware({ headers: { authorization: `Bearer ${token}` } }, {}, (error) => { nextError = error; });
    assert.equal(nextError.statusCode, 401, tokenKind);
    assert.match(nextError.message, /sign in again/);
    assert.equal(harness.databaseCalls(), 0);
  }
});

test('auth preserves unrelated database errors and approves a valid authenticated seller', async () => {
  const databaseError = new Error('simulated database failure');
  const broken = authHarness(databaseError);
  const validToken = jwt.sign({ id: 'seller-id', role: 'seles' }, broken.secret, { expiresIn: '1h' });
  let nextError;
  await broken.middleware({ headers: { authorization: `Bearer ${validToken}` } }, {}, (error) => { nextError = error; });
  assert.equal(nextError, databaseError);
  const valid = authHarness();
  const request = { headers: { authorization: `Bearer ${validToken}` } };
  await valid.middleware(request, {}, (error) => { nextError = error; });
  assert.equal(nextError, undefined);
  assert.equal(request.user.id, 'seller-id');
  assert.equal(request.user.role, 'seles');
});

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const ts = require('typescript');

// Only the actual mail helper is loaded. Config and nodemailer are mocked, so
// this suite cannot load environment secrets, open SMTP sockets, or send emails.
function mailerHarness({ email = {}, failure, verificationFailure } = {}) {
  const config = {
    env: 'test',
    email: {
      host: 'smtp.example.test',
      port: '587',
      address: 'smtp-user@example.test',
      pass: 'smtp-test-password',
      from: 'sender@example.test',
      ...email,
    },
  };
  const transportOptions = [];
  const messages = [];
  const diagnostics = [];
  let verificationCalls = 0;
  const transport = {
    verify: async () => {
      verificationCalls += 1;
      if (verificationFailure) throw verificationFailure;
      return true;
    },
    sendMail: async (message) => {
      messages.push(message);
      if (failure) throw failure;
      return { messageId: 'local-message-id', accepted: [message.to], rejected: [] };
    },
  };
  const nodemailer = { createTransport: (options) => { transportOptions.push(options); return transport; } };
  class AppError extends Error { constructor(statusCode, message) { super(message); this.statusCode = statusCode; } }
  const filename = path.join(__dirname, '..', 'src/app/helper/sendMailer.ts');
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  const dependencies = { nodemailer, '../config': config, '../error/appError': AppError };
  const requireMock = (name) => {
    assert.ok(Object.hasOwn(dependencies, name), `Unexpected mailer dependency: ${name}`);
    return dependencies[name];
  };
  const consoleMock = Object.fromEntries(['log', 'warn', 'error', 'info', 'debug'].map((method) => [method, (...values) => diagnostics.push(values)]));
  vm.runInNewContext('(function(require, module, exports) {\n' + compiled + '\n})', { console: consoleMock }, { filename })(requireMock, module, module.exports);
  return { sendMailer: module.exports.default, createMailTransport: module.exports.createMailTransport, verifyMailTransport: module.exports.verifyMailTransport, config, transportOptions, messages, diagnostics, verificationCalls: () => verificationCalls };
}

test('port 465 uses implicit TLS with SMTP debugging disabled', async () => {
  const harness = mailerHarness({ email: { port: '465' } });
  await harness.sendMailer('recipient@example.test', 'OTP subject', '<p>Example OTP</p>');
  const options = harness.transportOptions[0];
  assert.equal(options.port, 465);
  assert.equal(options.secure, true);
  assert.notEqual(options.debug, true);
  assert.notEqual(options.logger, true);
  assert.equal(options.tls?.rejectUnauthorized === false, false);
});

test('port 587 requires STARTTLS without enabling implicit TLS', async () => {
  const harness = mailerHarness();
  await harness.sendMailer('recipient@example.test', 'OTP subject', '<p>Example OTP</p>');
  const options = harness.transportOptions[0];
  assert.equal(options.port, 587);
  assert.equal(options.secure, false);
  assert.equal(options.requireTLS, true);
});

test('mail uses the configured sender and SMTP identity while preserving the requested recipient and content', async () => {
  const harness = mailerHarness();
  const html = '<p>Your OTP is 123456</p>';
  await harness.sendMailer('account-holder@example.test', 'Verify your email', html);
  const options = harness.transportOptions[0];
  assert.equal(options.auth.user, 'smtp-user@example.test');
  assert.equal(options.auth.pass, 'smtp-test-password');
  const message = harness.messages[0];
  assert.equal(message.from.name, 'DealClosedPartner');
  assert.equal(message.from.address, 'sender@example.test');
  assert.equal(message.to, 'account-holder@example.test');
  assert.equal(message.subject, 'Verify your email');
  assert.equal(message.html, html);
  assert.ok(!JSON.stringify(message.from).includes('your company name'));
});

test('Gmail normalizes a 16-character app password copied with grouping spaces', async () => {
  const harness = mailerHarness({ email: { host: 'smtp.gmail.com', pass: 'abcd efgh ijkl mnop' } });
  await harness.sendMailer('recipient@example.test', 'OTP', '<p>OTP</p>');
  assert.equal(harness.transportOptions[0].auth.pass, 'abcdefghijklmnop');
});

test('provider-specific normalization preserves whitespace in other SMTP passwords', async () => {
  const password = '  other SMTP password  ';
  const harness = mailerHarness({ email: { host: 'smtp.example.test', pass: password } });
  await harness.sendMailer('recipient@example.test', 'OTP', '<p>OTP</p>');
  assert.equal(harness.transportOptions[0].auth.pass, password);
});

test('missing SMTP configuration fails with a safe 503 before creating a transport', async () => {
  for (const field of ['host', 'address', 'pass']) {
    const harness = mailerHarness({ email: { [field]: undefined } });
    await assert.rejects(harness.sendMailer('recipient@example.test', 'OTP', '<p>OTP</p>'), (error) => {
      assert.equal(error.statusCode, 503, field);
      assert.ok(error.message.length > 0);
      assert.ok(!error.message.includes('smtp-test-password'));
      return true;
    });
    assert.equal(harness.transportOptions.length, 0, field);
    assert.equal(harness.messages.length, 0, field);
  }
});

test('optional port defaults to 587 and an absent sender falls back to the SMTP identity', async () => {
  const harness = mailerHarness({ email: { port: undefined, from: undefined } });
  await harness.sendMailer('recipient@example.test', 'OTP', '<p>OTP</p>');
  assert.equal(harness.transportOptions[0].port, 587);
  assert.equal(harness.transportOptions[0].requireTLS, true);
  assert.equal(harness.messages[0].from.address, 'smtp-user@example.test');
});

test('configuration trims SMTP host, login address, and sender without altering generic passwords', async () => {
  const harness = mailerHarness({ email: { host: ' smtp.example.test ', address: ' smtp-user@example.test ', from: ' sender@example.test ', pass: ' exact password ' } });
  await harness.sendMailer('recipient@example.test', 'OTP', '<p>OTP</p>');
  assert.equal(harness.transportOptions[0].host, 'smtp.example.test');
  assert.equal(harness.transportOptions[0].auth.user, 'smtp-user@example.test');
  assert.equal(harness.transportOptions[0].auth.pass, ' exact password ');
  assert.equal(harness.messages[0].from.address, 'sender@example.test');
});

test('invalid SMTP ports fail before any delivery is attempted', async () => {
  for (const port of ['not-a-port', '0', '-1', '65536', '587.5']) {
    const harness = mailerHarness({ email: { port } });
    await assert.rejects(harness.sendMailer('recipient@example.test', 'OTP', '<p>OTP</p>'), { statusCode: 503 });
    assert.equal(harness.messages.length, 0, port);
  }
});

test('SMTP authentication failures become a generic 503 without exposing the raw provider response', async () => {
  const raw = 'EAUTH synthetic-sensitive-auth-response';
  const failure = Object.assign(new Error(raw), { code: 'EAUTH', response: raw, responseCode: 535 });
  const harness = mailerHarness({ failure });
  await assert.rejects(harness.sendMailer('recipient@example.test', 'OTP', '<p>OTP</p>'), (error) => {
    assert.equal(error.statusCode, 503);
    assert.notEqual(error, failure);
    assert.ok(!error.message.includes(raw));
    assert.ok(!error.message.includes('535'));
    return true;
  });
});

test('SMTP network and recipient failures use the same safe recovery contract', async () => {
  for (const code of ['ECONNECTION', 'ETIMEDOUT', 'ESOCKET', 'EENVELOPE']) {
    const failure = Object.assign(new Error(`synthetic-provider-detail-${code}`), { code });
    const harness = mailerHarness({ failure });
    await assert.rejects(harness.sendMailer('recipient@example.test', 'OTP', '<p>OTP</p>'), (error) => {
      assert.equal(error.statusCode, 503, code);
      assert.ok(!error.message.includes('synthetic-provider-detail'));
      return true;
    });
  }
});

test('transport verification checks SMTP availability without sending any message', async () => {
  const harness = mailerHarness();
  assert.equal(typeof harness.createMailTransport, 'function');
  assert.equal(typeof harness.verifyMailTransport, 'function');
  await harness.verifyMailTransport();
  assert.equal(harness.verificationCalls(), 1);
  assert.equal(harness.messages.length, 0);
  assert.equal(harness.transportOptions.length, 1);
});

test('failed transport verification returns the same sanitized 503 without sending a message', async () => {
  const verificationFailure = Object.assign(new Error('synthetic-secret-verification-response'), { code: 'EAUTH', responseCode: 535 });
  const harness = mailerHarness({ verificationFailure });
  await assert.rejects(harness.verifyMailTransport(), (error) => {
    assert.equal(error.statusCode, 503);
    assert.equal(error.message, 'Email delivery is temporarily unavailable. Please try again later.');
    assert.ok(!error.message.includes('synthetic-secret'));
    return true;
  });
  assert.equal(harness.messages.length, 0);
});

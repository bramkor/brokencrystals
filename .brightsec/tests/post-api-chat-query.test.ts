import { test, before, after } from 'node:test';
import { SecRunner } from '@sectester/runner';
import { AttackParamLocation, HttpMethod } from '@sectester/scan';

const timeout = 40 * 60 * 1000;
const baseUrl = process.env.BRIGHT_TARGET_URL!;

let runner!: SecRunner;

before(async () => {
  runner = new SecRunner({
    hostname: process.env.BRIGHT_HOSTNAME!,
    projectId: process.env.BRIGHT_PROJECT_ID!
  });

  await runner.init();
});

after(() => runner.clear());

test('POST /api/chat/query', { signal: AbortSignal.timeout(timeout) }, async () => {
  await runner
    .createScan({
      tests: ['csrf', 'xss', 'secret_tokens', 'insecure_tls_configuration', 'server_side_js_injection'],
      attackParamLocations: [AttackParamLocation.BODY, AttackParamLocation.HEADER],
      starMetadata: {}
    })
    .setFailFast(false)
    .timeout(timeout)
    .run({
      method: HttpMethod.POST,
      url: `${baseUrl}/api/chat/query`,
      body: [{"role":"user","content":"Hello, how are you?"}],
      headers: {
        'x-xss-protection': '0',
        'strict-transport-security': 'max-age=0',
        'x-content-type-options': '1',
        'content-security-policy': "default-src  * 'unsafe-inline' 'unsafe-eval'"
      },
      auth: process.env.BRIGHT_AUTH_ID
    });
});

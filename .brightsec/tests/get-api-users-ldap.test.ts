import { test, before, after } from 'node:test';
import { SecRunner } from '@bramkortooms/sectester-runner';
import { Severity, AttackParamLocation, HttpMethod } from '@bramkortooms/sectester-scan';

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

test('GET /api/users/ldap', { signal: AbortSignal.timeout(timeout) }, async () => {
  await runner
    .createScan({
      tests: ['ldapi', 'xss', 'csrf', 'open_database', 'secret_tokens'],
      attackParamLocations: [AttackParamLocation.QUERY]
    })
    .waitForCompletion()
    .timeout(timeout)
    .run({
      method: HttpMethod.GET,
      url: `${baseUrl}/api/users/ldap?query=%28%26%28objectClass%3Dperson%29%28objectClass%3Duser%29%28email%3Djohn.doe%40example.com%29%29`
    });
});

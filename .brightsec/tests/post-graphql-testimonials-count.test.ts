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

test('POST /graphql-testimonials-count', { signal: AbortSignal.timeout(timeout) }, async () => {
  await runner
    .createScan({
      tests: ['graphql_introspection', 'sqli', 'jwt', 'xss'],
      attackParamLocations: [AttackParamLocation.BODY],
      starMetadata: {}
    })
    .setFailFast(false)
    .timeout(timeout)
    .run({
      method: HttpMethod.POST,
      url: `${baseUrl}/graphql`,
      body: {
        query: "query testimonialsCount($query: String!) { testimonialsCount(query: $query) }",
        variables: { query: "SELECT COUNT(*) FROM testimonials" }
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer <token>'
      },
      auth: process.env.BRIGHT_AUTH_ID
    });
});

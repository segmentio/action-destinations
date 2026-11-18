/**
 * E2E entrypoint for Webhook. Opt-in: runs only when RUN_E2E=1. Needs no secrets.
 *
 *   ./bin/run serve --destination webhook --noUI          # binds 127.0.0.1:3000
 *   cd packages/destination-actions
 *   RUN_E2E=1 ./node_modules/.bin/jest --testPathPattern="webhook/__test__/e2e"
 */
import { runE2EFixtures } from '../../../lib/e2e'
import { config } from '../__e2e__'
import sendFixtures from '../send/__e2e__/fixtures.e2e'

if (process.env.RUN_E2E) {
  runE2EFixtures({
    destination: 'webhook',
    action: 'send',
    config,
    fixtures: sendFixtures,
    // httpbin.org is a shared public service; one retry absorbs an occasional blip.
    defaultRetries: 1
  })
} else {
  describe.skip('E2E: webhook (set RUN_E2E=1 to run)', () => {
    it('skipped unless RUN_E2E=1', () => {
      expect(true).toBe(true)
    })
  })
}

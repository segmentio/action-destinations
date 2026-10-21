/**
 * E2E entrypoint for Mixpanel. Opt-in: runs only when RUN_E2E=1, so normal `yarn cloud test` and
 * CI stay green without a running serve server.
 *
 * Run it:
 *   ./bin/run serve --destination mixpanel --noUI          # binds 127.0.0.1:3000
 *   RUN_E2E=1 BASE_URL=http://127.0.0.1:3000 \
 *     packages/destination-actions/node_modules/.bin/jest \
 *     --testPathPattern="mixpanel/__test__/e2e"
 *
 * The `error` fixture passes with no secrets. For the `success` fixtures, also export
 * E2E_MIXPANEL_PROJECT_TOKEN and E2E_MIXPANEL_API_SECRET (e.g. via chamber).
 */
import { runE2EFixtures } from '../../../lib/e2e'
import { config } from '../__e2e__'
import trackEventFixtures from '../trackEvent/__e2e__/fixtures.e2e'

if (process.env.RUN_E2E) {
  runE2EFixtures({
    destination: 'mixpanel',
    action: 'trackEvent',
    config,
    fixtures: trackEventFixtures
  })
} else {
  // Keep jest happy (a test file must contain at least one test) and make the skip visible.
  describe.skip('E2E: mixpanel (set RUN_E2E=1 to run)', () => {
    it('skipped unless RUN_E2E=1', () => {
      expect(true).toBe(true)
    })
  })
}

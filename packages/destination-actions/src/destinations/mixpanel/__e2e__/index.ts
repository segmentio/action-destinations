/**
 * E2E config for Mixpanel.
 *
 * Required environment variables (only for the success/failure fixtures; the `error` fixtures run
 * without any secrets):
 * - E2E_MIXPANEL_PROJECT_TOKEN: Mixpanel project token.
 * - E2E_MIXPANEL_API_SECRET:    Mixpanel project API secret (used by the Import Events API).
 *
 * Both must belong to the same Mixpanel test/sandbox project. Export them (e.g. via chamber)
 * before running with RUN_E2E=1.
 */
import type { E2EDestinationConfig } from '../../../lib/e2e'

export const config: E2EDestinationConfig = {
  settings: {
    projectToken: { $env: 'E2E_MIXPANEL_PROJECT_TOKEN' },
    apiSecret: { $env: 'E2E_MIXPANEL_API_SECRET' },
    apiRegion: 'US 🇺🇸',
    strictMode: '1'
  }
}

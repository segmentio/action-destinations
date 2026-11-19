/**
 * E2E config and suites for Mixpanel.
 *
 * Required environment variables:
 * - E2E_MIXPANEL_PROJECT_TOKEN: Mixpanel project token.
 * - E2E_MIXPANEL_API_SECRET:    Mixpanel project API secret (used by the Import Events API).
 *
 * Both must belong to the same Mixpanel sandbox project.
 */
import type { E2EDestinationConfig, E2ESuite } from '../../../lib/e2e/types'
import definition from '..'
import trackEventFixtures from '../trackEvent/__e2e__/fixtures.e2e'

export const config: E2EDestinationConfig = {
  settings: {
    projectToken: { $env: 'E2E_MIXPANEL_PROJECT_TOKEN' },
    apiSecret: { $env: 'E2E_MIXPANEL_API_SECRET' },
    apiRegion: 'US 🇺🇸',
    strictMode: '1'
  }
}

export const suites: E2ESuite[] = [
  { destination: 'mixpanel', action: 'trackEvent', definition, config, fixtures: trackEventFixtures }
]

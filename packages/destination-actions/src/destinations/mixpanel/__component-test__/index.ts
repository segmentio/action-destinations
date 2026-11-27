/**
 * Component test config and suites for Mixpanel.
 *
 * Required environment variables:
 * - CT_MIXPANEL_PROJECT_TOKEN: Mixpanel project token.
 * - CT_MIXPANEL_API_SECRET:    Mixpanel project API secret (used by the Import Events API).
 *
 * Both must belong to the same Mixpanel sandbox project.
 */
import type { CTDestinationConfig, CTSuite } from '../../../lib/component-test/types'
import definition from '..'
import trackEventFixtures from '../trackEvent/__component-test__/fixtures.ct'

export const config: CTDestinationConfig = {
  settings: {
    projectToken: { $env: 'CT_MIXPANEL_PROJECT_TOKEN' },
    apiSecret: { $env: 'CT_MIXPANEL_API_SECRET' },
    apiRegion: 'US 🇺🇸',
    strictMode: '1'
  }
}

export const suites: CTSuite[] = [
  { destination: 'mixpanel', action: 'trackEvent', definition, config, fixtures: trackEventFixtures }
]

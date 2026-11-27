/**
 * Component test config and suites for Mixpanel.
 *
 * Required environment variable:
 * - CT_MIXPANEL_PROJECT_TOKEN: token of the Mixpanel sandbox project. The /import fixtures turn on
 *   actions-mixpanel-project-token-auth, so it also authenticates the Import Events API.
 */
import type { CTDestinationConfig, CTSuite } from '../../../lib/component-test/types'
import definition from '..'
import trackEventFixtures from '../trackEvent/__component-test__/fixtures.ct'
import nonStrictFixtures from '../trackEvent/__component-test__/non-strict.ct'

export const config: CTDestinationConfig = {
  settings: {
    projectToken: { $env: 'CT_MIXPANEL_PROJECT_TOKEN' },
    apiRegion: 'US 🇺🇸',
    strictMode: '1'
  }
}

export const nonStrictConfig: CTDestinationConfig = {
  settings: { ...config.settings, strictMode: '0' }
}

export const suites: CTSuite[] = [
  { destination: 'mixpanel', action: 'trackEvent', definition, config, fixtures: trackEventFixtures },
  { destination: 'mixpanel', action: 'trackEvent', definition, config: nonStrictConfig, fixtures: nonStrictFixtures }
]

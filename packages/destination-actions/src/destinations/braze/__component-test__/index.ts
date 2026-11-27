/**
 * Component test config and suites for Braze Cloud Mode (actions-braze-cloud).
 *
 * Required environment variables:
 * - CT_BRAZE_API_KEY:  REST API key of the Braze sandbox workspace, with users.track and users.alias.new.
 * - CT_BRAZE_ENDPOINT: that workspace's REST endpoint, e.g. https://rest.iad-01.braze.com.
 *
 * Every action here takes its sync mode from `__segment_internal_sync_mode` in the mapping, as a
 * stored subscription carries it, so each fixture sets it.
 */
import type { CTDestinationConfig, CTSuite } from '../../../lib/component-test/types'
import definition from '..'
import trackEventFixtures from '../trackEvent2/__component-test__/fixtures.ct'
import invalidKeyFixtures from '../trackEvent2/__component-test__/invalid-key.ct'
import trackPurchaseFixtures from '../trackPurchase2/__component-test__/fixtures.ct'
import updateUserProfileFixtures from '../updateUserProfile2/__component-test__/fixtures.ct'
import createAliasFixtures from '../createAlias2/__component-test__/fixtures.ct'

export const config: CTDestinationConfig = {
  settings: {
    api_key: { $env: 'CT_BRAZE_API_KEY' },
    endpoint: { $env: 'CT_BRAZE_ENDPOINT' }
  }
}

// A key Braze rejects, for the 401 fixtures. Not a secret.
export const invalidKeyConfig: CTDestinationConfig = {
  settings: {
    api_key: 'e2e-invalid-api-key',
    endpoint: { $env: 'CT_BRAZE_ENDPOINT' }
  }
}

export const suites: CTSuite[] = [
  { destination: 'braze', action: 'trackEvent2', definition, config, fixtures: trackEventFixtures },
  { destination: 'braze', action: 'trackEvent2', definition, config: invalidKeyConfig, fixtures: invalidKeyFixtures },
  { destination: 'braze', action: 'trackPurchase2', definition, config, fixtures: trackPurchaseFixtures },
  // Braze applies profile writes asynchronously; one suite-level retry absorbs a transient 5xx.
  {
    destination: 'braze',
    action: 'updateUserProfile2',
    definition,
    config,
    fixtures: updateUserProfileFixtures,
    retries: 1
  },
  { destination: 'braze', action: 'createAlias2', definition, config, fixtures: createAliasFixtures }
]

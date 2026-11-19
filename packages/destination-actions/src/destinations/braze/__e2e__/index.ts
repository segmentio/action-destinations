/**
 * E2E config and suites for Braze Cloud Mode (actions-braze-cloud).
 *
 * Required environment variables:
 * - E2E_BRAZE_API_KEY:  REST API key of the Braze sandbox workspace, with users.track and users.alias.new.
 * - E2E_BRAZE_ENDPOINT: that workspace's REST endpoint, e.g. https://rest.iad-01.braze.com.
 *
 * Every action here takes its sync mode from `__segment_internal_sync_mode` in the mapping, as a
 * stored subscription carries it, so each fixture sets it.
 */
import type { E2EDestinationConfig, E2ESuite } from '../../../lib/e2e/types'
import definition from '..'
import trackEventFixtures from '../trackEvent2/__e2e__/fixtures.e2e'
import invalidKeyFixtures from '../trackEvent2/__e2e__/invalid-key.e2e'
import trackPurchaseFixtures from '../trackPurchase2/__e2e__/fixtures.e2e'
import updateUserProfileFixtures from '../updateUserProfile2/__e2e__/fixtures.e2e'
import createAliasFixtures from '../createAlias2/__e2e__/fixtures.e2e'

export const config: E2EDestinationConfig = {
  settings: {
    api_key: { $env: 'E2E_BRAZE_API_KEY' },
    endpoint: { $env: 'E2E_BRAZE_ENDPOINT' }
  }
}

// A key Braze rejects, for the 401 fixtures. Not a secret.
export const invalidKeyConfig: E2EDestinationConfig = {
  settings: {
    api_key: 'e2e-invalid-api-key',
    endpoint: { $env: 'E2E_BRAZE_ENDPOINT' }
  }
}

export const suites: E2ESuite[] = [
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

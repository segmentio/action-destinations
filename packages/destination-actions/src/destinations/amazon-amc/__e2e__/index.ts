/**
 * Required environment variables:
 * - E2E_AMAZON_AMC_CLIENT_ID: OAuth client ID of the AMC app (Login with Amazon)
 * - E2E_AMAZON_AMC_CLIENT_SECRET: OAuth client secret of the AMC app
 * - E2E_AMAZON_AMC_REFRESH_TOKEN: a refresh token for that app carrying the audiences scope, for a user
 *   with access to the advertiser below
 * - E2E_AMAZON_AMC_ADVERTISER_ID: the DSP advertiser the audience is created under
 *
 * extendRequest reads the OAuth client from the environment rather than from settings, so this is
 * needed as well, with the same value as E2E_AMAZON_AMC_CLIENT_ID:
 * - ACTIONS_AMAZON_AMC_CLIENT_ID
 */
import type { E2EAudienceDestinationConfig } from '@segment/actions-core'

const advertiserId = process.env.E2E_AMAZON_AMC_ADVERTISER_ID ?? ''

export const config: E2EAudienceDestinationConfig = {
  settings: {
    region: 'https://advertising-api.amazon.com',
    oauth: {
      access_token: 'will_be_refreshed',
      refresh_token: { $env: 'E2E_AMAZON_AMC_REFRESH_TOKEN' },
      clientId: { $env: 'E2E_AMAZON_AMC_CLIENT_ID' },
      clientSecret: { $env: 'E2E_AMAZON_AMC_CLIENT_SECRET' }
    }
  },
  audience: {
    audienceName: `e2e_amazon_amc_${Date.now()}`,
    audienceSettings: {
      advertiserId,
      countryCode: 'US',
      description: 'Segment e2e test audience',
      externalAudienceId: `e2e_${Date.now()}`
    },
    createAudience: true,
    getAudience: true,
    teardown: false
  }
}

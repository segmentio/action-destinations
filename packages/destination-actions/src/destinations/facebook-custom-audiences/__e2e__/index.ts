/**
 * Required environment variables:
 * - E2E_FACEBOOK_CUSTOM_AUDIENCES_ACCESS_TOKEN: Long-lived Facebook OAuth access token
 * - E2E_FACEBOOK_CUSTOM_AUDIENCES_AD_ACCOUNT_ID: Facebook Advertiser Account ID (e.g., act_123456789)
 */
import type { E2EAudienceDestinationConfig } from '@segment/actions-core'

const audienceName = `e2e_test_audience_${Date.now()}`

// "e2e_existing_audience_do_not_delete", created once in the e2e ad account so that createAudience has
// an audience which already exists to connect to. If it is ever deleted, create a replacement and put
// its id here - the e2e suite does not create it.
const EXISTING_AUDIENCE_ID = '120251031521470690'

export const config: E2EAudienceDestinationConfig = {
  settings: {
    retlAdAccountId: { $env: 'E2E_FACEBOOK_CUSTOM_AUDIENCES_AD_ACCOUNT_ID' },
    oauth: {
      access_token: { $env: 'E2E_FACEBOOK_CUSTOM_AUDIENCES_ACCESS_TOKEN' },
      refresh_token: 'unused'
    }
  },
  audience: [
    {
      key: 'created',
      audienceName,
      audienceSettings: { audienceDescription: 'Audience created by the action-destinations e2e suite.' },
      createAudience: true,
      getAudience: true,
      teardown: false
    },
    {
      key: 'existing',
      audienceName: `e2e_ignored_audience_name_${Date.now()}`,
      audienceSettings: { existingAudienceId: EXISTING_AUDIENCE_ID },
      createAudience: true,
      getAudience: true,
      teardown: false
    }
  ]
}

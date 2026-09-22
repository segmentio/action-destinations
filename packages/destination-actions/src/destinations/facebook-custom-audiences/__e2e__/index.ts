/**
 * Required environment variables:
 * - E2E_FACEBOOK_CUSTOM_AUDIENCES_ACCESS_TOKEN: Long-lived Facebook OAuth access token
 * - E2E_FACEBOOK_CUSTOM_AUDIENCES_AD_ACCOUNT_ID: Facebook Advertiser Account ID (e.g., act_123456789)
 */
import type { E2EAudienceDestinationConfig } from '@segment/actions-core'

const audienceName = `e2e_test_audience_${Date.now()}`

// A Facebook Custom Audience which already exists in the e2e ad account. createAudience must
// connect to it and return this exact id rather than creating a new audience.
const EXISTING_AUDIENCE_ID = '120250946013450690'

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

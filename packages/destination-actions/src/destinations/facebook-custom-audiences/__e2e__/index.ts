/**
 * Required environment variables:
 * - E2E_FACEBOOK_CUSTOM_AUDIENCES_ACCESS_TOKEN: Long-lived Facebook OAuth access token
 * - E2E_FACEBOOK_CUSTOM_AUDIENCES_AD_ACCOUNT_ID: Facebook Advertiser Account ID (e.g., act_123456789)
 */
import type { E2EAudienceDestinationConfig } from '@segment/actions-core'

const audienceName = `e2e_test_audience_${Date.now()}`

export const config: E2EAudienceDestinationConfig = {
  settings: {
    retlAdAccountId: { $env: 'E2E_FACEBOOK_CUSTOM_AUDIENCES_AD_ACCOUNT_ID' },
    oauth: {
      access_token: { $env: 'E2E_FACEBOOK_CUSTOM_AUDIENCES_ACCESS_TOKEN' },
      refresh_token: 'unused'
    }
  },
  audience: {
    audienceName,
    audienceSettings: {},
    createAudience: true,
    getAudience: true,
    teardown: false
  }
}

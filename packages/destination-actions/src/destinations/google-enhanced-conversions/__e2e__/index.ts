import type { E2EAudienceDestinationConfig } from '@segment/actions-core'

export const config: E2EAudienceDestinationConfig = {
  settings: {
    customerId: { $env: 'E2E_GOOGLE_ADS_CUSTOMER_ID' },
    oauth: {
      access_token: 'will_be_refreshed',
      refresh_token: { $env: 'E2E_GOOGLE_ADS_REFRESH_TOKEN' },
      clientId: { $env: 'E2E_GOOGLE_ADS_CLIENT_ID' },
      clientSecret: { $env: 'E2E_GOOGLE_ADS_CLIENT_SECRET' }
    }
  },
  audience: {
    audienceName: 'e2e_test_user_list',
    audienceSettings: {
      supports_conversions: false,
      external_id_type: 'CONTACT_INFO'
    },
    createAudience: true,
    getAudience: true,
    teardown: false
  }
}

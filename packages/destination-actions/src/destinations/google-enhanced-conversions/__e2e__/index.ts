/**
 * Required environment variables:
 * - E2E_GOOGLE_ADS_CUSTOMER_ID: Google Ads customer ID
 * - E2E_GOOGLE_ADS_REFRESH_TOKEN: OAuth refresh token for Google Ads API
 * - E2E_GOOGLE_ADS_CLIENT_ID: OAuth client ID
 * - E2E_GOOGLE_ADS_CLIENT_SECRET: OAuth client secret
 * - ADWORDS_DEVELOPER_TOKEN: Google Ads API developer token (used in request headers)
 * - GOOGLE_ENHANCED_CONVERSIONS_CLIENT_ID: Client ID used for token refresh at runtime
 * - GOOGLE_ENHANCED_CONVERSIONS_CLIENT_SECRET: Client secret used for token refresh at runtime
 */
import type { E2EAudienceDestinationConfig } from '@segment/actions-core'

const audienceName = `e2e_test_user_list_${Date.now()}` // to ensure the audience name is unique across test runs

export const config: E2EAudienceDestinationConfig = {
  settings: {
    customerId: { $env: 'E2E_GOOGLE_ADS_CUSTOMER_ID' },
    //loginCustomerId: { $env: 'E2E_GOOGLE_ADS_LOGIN_CUSTOMER_ID' },
    oauth: {
      access_token: 'will_be_refreshed',
      refresh_token: { $env: 'E2E_GOOGLE_ADS_REFRESH_TOKEN' },
      clientId: { $env: 'E2E_GOOGLE_ADS_CLIENT_ID' },
      clientSecret: { $env: 'E2E_GOOGLE_ADS_CLIENT_SECRET' }
    }
  },
  audience: {
    audienceName,
    audienceSettings: {
      supports_conversions: false,
      external_id_type: 'CONTACT_INFO'
    },
    createAudience: true,
    getAudience: true,
    teardown: false
  }
}

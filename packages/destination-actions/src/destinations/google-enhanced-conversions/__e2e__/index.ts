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
import type { E2EAudienceDestinationConfig, E2ETeardownAudienceContext } from '@segment/actions-core'

const audienceName = `e2e_test_user_list_${Date.now()}`

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
    audienceName,
    audienceSettings: {
      supports_conversions: false,
      external_id_type: 'CONTACT_INFO'
    },
    createAudience: true,
    getAudience: true,
    teardown: async (context: E2ETeardownAudienceContext) => {
      const { settings, externalAudienceId } = context
      const oauth = settings.oauth as { refresh_token: string; clientId: string; clientSecret: string }
      const customerId = settings.customerId as string

      const tokenResponse = await fetch('https://www.googleapis.com/oauth2/v4/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          refresh_token: oauth.refresh_token,
          client_id: process.env.GOOGLE_ENHANCED_CONVERSIONS_CLIENT_ID ?? oauth.clientId,
          client_secret: process.env.GOOGLE_ENHANCED_CONVERSIONS_CLIENT_SECRET ?? oauth.clientSecret,
          grant_type: 'refresh_token'
        })
      })

      if (!tokenResponse.ok) {
        throw new Error(`Failed to refresh token: ${tokenResponse.statusText}`)
      }

      const { access_token } = (await tokenResponse.json()) as { access_token: string }

      const response = await fetch(
        `https://googleads.googleapis.com/v21/customers/${customerId}/userLists:mutate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'developer-token': process.env.ADWORDS_DEVELOPER_TOKEN ?? '',
            authorization: `Bearer ${access_token}`
          },
          body: JSON.stringify({
            operations: [{ remove: `customers/${customerId}/userLists/${externalAudienceId}` }]
          })
        }
      )

      if (!response.ok) {
        const body = await response.text()
        throw new Error(`Failed to delete user list ${externalAudienceId}: ${response.status} ${body}`)
      }
    }
  }
}

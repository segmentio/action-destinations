import type { AudienceDestinationDefinition } from '@segment/actions-core'
import { InvalidAuthenticationError, IntegrationError, ErrorCodes } from '@segment/actions-core'
import type { RefreshTokenResponse, AmazonRefreshTokenError, AmazonTestAuthenticationError } from './types'
import type { Settings } from './generated-types'

import syncAudiences from './syncAudiences'

// For an example audience destination, refer to webhook-audiences. The Readme section is under 'Audience Support'
const destination: AudienceDestinationDefinition<Settings> = {
  name: 'Amazon Ads',
  slug: 'actions-amazon-ads',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {
      region: {
        label: 'Region',
        description: 'Region for API Endpoint, either NA, EU, FE.',
        choices: [
          { label: 'North America (NA)', value: 'https://advertising-api.amazon.com' },
          { label: 'Europe (EU)', value: 'https://advertising-api-eu.amazon.com' },
          { label: 'Far East (FE)', value: 'https://advertising-api-fe.amazon.com' }
        ],
        default: 'North America (NA)',
        type: 'string',
        required: true
      }
    },
    testAuthentication: async (request, { auth }) => {
      if (!auth?.accessToken) {
        throw new InvalidAuthenticationError('Please authenticate via Oauth before enabling the destination.')
      }

      try {
        await request<RefreshTokenResponse>('https://advertising-api.amazon.com/v2/profiles', {
          method: 'GET'
        })
      } catch (e: any) {
        const error = e as AmazonTestAuthenticationError
        if (error.message === 'Unauthorized') {
          throw new Error(
            'Invalid Amazon Oauth access token. Please reauthenticate to retrieve a valid access token before enabling the destination.'
          )
        }
        throw e
      }
    },
    refreshAccessToken: async (request, { auth }) => {
      let res

      try {
        res = await request<RefreshTokenResponse>('https://api.amazon.com/auth/o2/token', {
          method: 'POST',
          body: new URLSearchParams({
            refresh_token: auth.refreshToken,
            client_id: auth.clientId,
            client_secret: auth.clientSecret,
            grant_type: 'refresh_token'
          })
        })
      } catch (e: any) {
        const error = e as AmazonRefreshTokenError
        if (error.response?.data?.error === 'invalid_grant') {
          throw new IntegrationError(
            `Invalid Authentication: Your refresh token is invalid or expired. Please re-authenticate to fetch a new refresh token.`,
            ErrorCodes.REFRESH_TOKEN_EXPIRED,
            401
          )
        }

        throw new IntegrationError(
          `Failed to fetch a new access token. Reason: ${error.response?.data?.error}`,
          ErrorCodes.OAUTH_REFRESH_FAILED,
          401
        )
      }

      return { accessToken: res?.data?.access_token }
    }
  },
  extendRequest({ auth }) {
    return {
      headers: {
        authorization: `Bearer ${auth?.accessToken}`
      }
    }
  },

  audienceFields: {},

  audienceConfig: {
    mode: {
      type: 'synced', // Indicates that the audience is synced on some schedule; update as necessary
      full_audience_sync: false // If true, we send the entire audience. If false, we just send the delta.
    }

    // Get/Create are optional and only needed if you need to create an audience before sending events/users.
    // createAudience: async (request, createAudienceInput) => {

    // },

    // getAudience: async (request, getAudienceInput) => {
    //   // Right now, `getAudience` will mostly serve as a check to ensure the audience still exists in the destination
    //   return {externalId: ''}
    // }
  },
  actions: {
    syncAudiences
  }
}

export default destination

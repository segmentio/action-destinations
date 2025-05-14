import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import type { RefreshTokenResponse, AmazonTestAuthenticationError } from './types'

import { InvalidAuthenticationError } from '@segment/actions-core'
import { getAuthToken } from './utils'
import trackConversion from './trackConversion'

const destination: DestinationDefinition<Settings> = {
  name: 'Amazon Conversions Api',
  slug: 'amazon-conversions-api',
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
        default: 'https://advertising-api.amazon.com',
        type: 'string',
        required: true
      },
      advertiserId: {
        label: 'Amazon Advertiser ID',
        description: 'Your Amazon Advertiser Account ID.',
        type: 'string',
        required: true
      },
      profileId: {
        label: 'Amazon Profile ID',
        description: 'Your Amazon Advertising API Profile ID.',
        type: 'string',
        required: true
      }
    },
    testAuthentication: async (request, { auth, settings }) => {
          if (!auth?.accessToken) {
            throw new InvalidAuthenticationError('Please authenticate via Oauth before enabling the destination.')
          }
    
          try {
            await request<RefreshTokenResponse>(`${settings.region}/v2/profiles`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              },
              timeout: 15000
            })
          } catch (e: any) {
            const error = e as AmazonTestAuthenticationError
            if (error.message === 'Unauthorized') {
              throw new InvalidAuthenticationError(
                'Invalid Amazon Oauth access token. Please reauthenticate to retrieve a valid access token before enabling the destination.'
              )
            }
            throw e
          }
        },
    refreshAccessToken: async (request, { auth }) => {
      const authToken = await getAuthToken(request, auth)
      return { accessToken: authToken }
    }
  },
  extendRequest({ auth }) {
    return {
      headers: {
        authorization: `Bearer ${auth?.accessToken}`,
        'Amazon-Advertising-API-ClientID': process.env.ACTIONS_AMAZON_CONVERSIONS_API_CLIENT_ID || ''
      }
    }
  },

  actions: {
    trackConversion
  }
}

export default destination

import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import updateAudience from './updateAudience'
import { LINKEDIN_API_VERSION } from './linkedin-properties'

interface RefreshTokenResponse {
  access_token: string
  scope: string
  expires_in: number
  token_type: string
}

const destination: DestinationDefinition<Settings> = {
  name: 'Linkedin Audiences',
  slug: 'actions-linkedin-audiences',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {
      ad_account_id: {
        label: 'LinkedIn Ad Account Id',
        description: 'The id of the LinkedIn Ad Account where batches should be synced.',
        type: 'string',
        required: true
      }
    },
    testAuthentication: async (request, { auth, settings }) => {
      return request(`https://api.linkedin.com/rest/adAccountsV2/${settings.ad_account_id}`, {
        method: 'POST',
        headers: {
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': LINKEDIN_API_VERSION,
          authorization: auth.accessToken
        }
      })
    },
    refreshAccessToken: async (request, { auth }) => {
      const res = await request<RefreshTokenResponse>('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        body: new URLSearchParams({
          refresh_token: auth.refreshToken,
          client_id: auth.clientId,
          client_secret: auth.clientSecret,
          grant_type: 'refresh_token'
        })
      })

      return { accessToken: res?.data?.access_token }
    }
  },
  extendRequest({ auth }) {
    return {
      headers: {
        authorization: `Bearer ${auth?.accessToken}`,
        'LinkedIn-Version': LINKEDIN_API_VERSION,
        'Content-Type': 'application/json'
      }
    }
  },

  actions: {
    updateAudience
  }
}

export default destination

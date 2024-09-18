import { AudienceDestinationDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from './generated-types'

import syncAudience from './syncAudience'

const ACCESS_TOKEN_URL = 'https://accounts.snapchat.com/login/oauth2/access_token'

interface RefreshTokenResponse {
  access_token: string
}
// For an example audience destination, refer to webhook-audiences. The Readme section is under 'Audience Support'
const destination: AudienceDestinationDefinition<Settings> = {
  name: 'Snapchat Audiences (Actions)',
  slug: 'actions-snapchat-audiences',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {
      ad_account_id: {
        label: 'Ad Account ID',
        description: 'The ID of the Snapchat Ad Account',
        required: true,
        type: 'string'
      }
    },
    refreshAccessToken: async (request, { auth }) => {
      // Return a request that refreshes the access_token if the API supports it
      const res = await request<RefreshTokenResponse>(ACCESS_TOKEN_URL, {
        method: 'POST',
        body: new URLSearchParams({
          refresh_token: auth.refreshToken,
          client_id: auth.clientId,
          client_secret: auth.clientSecret,
          grant_type: 'refresh_token'
        })
      })

      return { accessToken: res.data.access_token }
    }
  },
  extendRequest({ auth }) {
    return {
      headers: {
        authorization: `Bearer ${auth?.accessToken}`
      }
    }
  },

  audienceFields: {
    placeholder: {
      type: 'boolean',
      label: 'Placeholder Setting',
      description: 'Placeholder field to allow the audience to be created. Do not change this',
      default: true
    }
    // This is a required object, but we don't need to define any fields
    // Placeholder setting will be removed once we make AudienceSettings optional
  },

  audienceConfig: {
    mode: {
      type: 'synced', // Indicates that the audience is synced on some schedule; update as necessary
      full_audience_sync: false // If true, we send the entire audience. If false, we just send the delta.
    },
    async createAudience(request, { settings, audienceName }) {
      const { ad_account_id } = settings

      if (!audienceName) {
        throw new IntegrationError('Missing audience name value', 'MISSING_REQUIRED_FIELD', 400)
      }

      const response = await request(`https://adsapi.snapchat.com/v1/adaccounts/${ad_account_id}/segments`, {
        method: 'POST',
        json: {
          segments: [
            {
              name: audienceName,
              source_type: 'FIRST_PARTY',
              ad_account_id
            }
          ]
        }
      })

      const data = response.json()

      console.dir(data, { depth: null })

      return { externalId: 'asdlfkjasdfkj' }
    },

    getAudience: async (request, { externalId }) => {
      const response = await request(`https://adsapi.snapchat.com/v1/segments/${externalId}`, {
        method: 'GET'
      })

      const data = response.json()

      console.dir(data, { depth: null })

      return { externalId: 'asdlfkjasdfkj' }
    }
  },

  // onDelete: async (request, { settings, payload }) => {
  // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
  // provided in the payload. If your destination does not support GDPR deletion you should not
  // implement this function and should remove it completely.
  // },

  actions: {
    syncAudience
  }
}

export default destination

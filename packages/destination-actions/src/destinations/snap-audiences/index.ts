import { AudienceDestinationDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'

import syncAudience from './syncAudience'
const ACCESS_TOKEN_URL = 'https://accounts.snapchat.com/login/oauth2/access_token'

interface RefreshTokenResponse {
  access_token: string
}

// For an example audience destination, refer to webhook-audiences. The Readme section is under 'Audience Support'
const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Snap Audiences (Actions)',
  slug: 'actions-snap-audiences',
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
    customAudienceName: {
      type: 'string',
      label: 'Audience Name',
      description: 'Name for the audience created in Snap. Defaults to the Segment audience name if left blank.',
      default: '',
      required: false
    }
  },

  audienceConfig: {
    mode: {
      type: 'synced',
      full_audience_sync: false
    },
    async createAudience(request, createAudienceInput) {
      const audienceName = createAudienceInput.audienceName
      const ad_account_id = createAudienceInput.settings.ad_account_id
      const customAudienceName = createAudienceInput.audienceSettings?.customAudienceName

      if (!audienceName) {
        throw new IntegrationError('Missing audience name value', 'MISSING_REQUIRED_FIELD', 400)
      }

      const response = await request(`https://adsapi.snapchat.com/v1/adaccounts/${ad_account_id}/segments`, {
        method: 'POST',
        json: {
          segments: [
            {
              name: `${customAudienceName !== '' ? customAudienceName : audienceName}`,
              source_type: 'FIRST_PARTY',
              ad_account_id
            }
          ]
        }
      })

      const data = await response.json()
      const snapAudienceId = data.segments[0].segment.id

      return { externalId: snapAudienceId }
    },

    getAudience: async (request, { externalId }) => {
      const response = await request(`https://adsapi.snapchat.com/v1/segments/${externalId}`, {
        method: 'GET'
      })

      const data = await response.json()
      const snapAudienceId = data.segments[0].segment.id

      return { externalId: snapAudienceId }
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

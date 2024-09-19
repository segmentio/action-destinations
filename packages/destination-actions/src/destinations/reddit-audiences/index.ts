import type { AudienceDestinationDefinition } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'
import { AuthSettings, RequestOptions } from './types'
import syncAudience from './syncAudience'

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Reddit Audiences',
  slug: 'actions-reddit-audiences',
  mode: 'cloud',
  authentication: {
    scheme: 'oauth2',
    fields: {
      ad_account_id: {
        type: 'string',
        label: 'Ad Account ID',
        description: 'Unique identifier of an ad account. This can be found in the Reddit UI.',
        required: true
      }
    },

    refreshAccessToken: async (request, { auth }) => {
      // Return a request that refreshes the access_token if the API supports it
      const res = await request('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        username: auth.clientId,
        password: auth.clientSecret,
        body: new URLSearchParams({
          refresh_token: auth.refreshToken,
          grant_type: 'refresh_token'
        })
      })
      const responseData = res.data as { access_token: string }
      return { accessToken: responseData.access_token }
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
    audienceName: {
      label: 'Audience Name',
      description: 'An audience name to display in Reddit',
      type: 'string',
      required: true
    }
  },
  audienceConfig: {
    mode: {
      type: 'synced',
      full_audience_sync: false
    },
    async createAudience(request, createAudienceInput) {

      const audience_type = 'CUSTOMER_LIST'
      const audience_name = createAudienceInput.audienceName
      const createAudienceUrl = `https://ads-api.reddit.com/api/v3/ad_accounts/${createAudienceInput.settings.ad_account_id}/custom_audiences`

      const request_payload = {
        data: {
          name: audience_name,
          type: audience_type
        }
      }

      const response = await request(createAudienceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Authorization: `Bearer ${auth?.accessToken}`
        },
        body: JSON.stringify(request_payload)
      })
      const jsonOutput = await response.json()
      return { externalId: (jsonOutput.data['id']) }
    },

    async getAudience(_, getAudienceInput) {
      return {
        externalId: getAudienceInput.externalId
      }
    }
  },
  actions: {
    syncAudience
  }
}

export default destination

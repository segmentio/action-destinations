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
    refreshAccessToken: async (
      request: (url: string, options?: RequestOptions) => Promise<any>,
      { auth }: { auth: AuthSettings }
    ) => {
     
      const baseUrl = 'https://www.reddit.com/api/v1/access_token'
      const body = `grant_type=refresh_token&refresh_token=${auth.refreshToken}`
      const res = await request(baseUrl, {
        method: 'POST',
        username: auth.clientId,
        password: auth.clientSecret,
        body
      })
      const responseData = res.data as { access_token: string }

      setAccessToken(responseData.access_token)
      return {
        accessToken: responseData.access_token
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
      
      // Must respond with the below object
      // return {
      //   externalId: String(audience_id) 
      // }
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

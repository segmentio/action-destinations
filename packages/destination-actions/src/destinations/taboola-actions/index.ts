import type { AudienceDestinationDefinition } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'
import { IntegrationError } from '@segment/actions-core'

import syncAudience from './syncAudience'

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Taboola (actions)',
  slug: 'actions-taboola-actions',
  mode: 'cloud',
  audienceFields: {
    accountId: {
      type: 'string',
      label: 'Account ID',
      required: true,
      description: 'The ID for the Taboola Account to sync to.'
    }
  },
  audienceConfig: {
    mode: {
      type: 'synced',
      full_audience_sync: false
    },
    async createAudience(request, createAudienceInput) {
      const audienceName = createAudienceInput.audienceName
      const accountId = createAudienceInput.audienceSettings?.accountId

      if (!audienceName) {
        throw new IntegrationError('Missing audience name value', 'MISSING_REQUIRED_FIELD', 400)
      }

      if (!accountId) {
        throw new IntegrationError('Missing Account ID value', 'MISSING_REQUIRED_FIELD', 400)
      }

      // TODO @Eden add code to create the Audience. It needs to return Taboola's ID for the Audience. 
      // This ID will be used when sending payloads to Taboola when adding or removing a user from an Audience.  
      // @Eden, do you need the access_token to be able to make this request? If so, I will need to make a platform change for this to work.
      
      const response = await request('https://example.com', {
        method: 'post',
        json: {
          name: audienceName,
          accountId: accountId
        },
         headers: {
           'Content-Type': 'application/json'
         }
      })

       return {
         externalId: response.audienceIDFromTaboola
       }

    },
    async getAudience(_, getAudienceInput) {
      return {
        externalId: getAudienceInput.externalId
      }
    }
  },
  authentication: {
    scheme: 'oauth-managed',
    fields: {
      client_id: {
        label: 'Client ID',
        description: 'The client ID from your Taboola account.',
        type: 'string',
        required: true
      },
      client_secret: {
        label: 'Client Secret',
        description: "The client's secret from your Taboola account.",
        type: 'string',
        required: true
      }
    },
    refreshAccessToken: async (request, { auth, settings }) => {
      // Return a request that refreshes the access_token if the API supports it
      const res = await request('https://www.example.com/oauth/refresh', {
        method: 'POST',
        body: new URLSearchParams({
          refresh_token: auth.refreshToken,
          client_id: settings.client_id,
          client_secret: settings.client_secret,
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
  actions: {
    syncAudience
  }
}

export default destination

import type { AudienceDestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import syncAudience from './syncAudience'

const destination: AudienceDestinationDefinition<Settings> = {
  name: 'Taboola (actions)',
  slug: 'actions-taboola-actions',
  mode: 'cloud',
  audienceFields: {
    audienceName: {
      type: 'string',
      label: 'Audience Name',
      required: true,
      description: 'The name of the audience you want to create in Taboola.'
    },
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
    async createAudience(request, createAudienceInput) {},
    async getAudience(request, getAudienceInput) {
      return {
        externalId: externalId
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
          client_id: settings.clientId,
          client_secret: auth.client_secret,
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

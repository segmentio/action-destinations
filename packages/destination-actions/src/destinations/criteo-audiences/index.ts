import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import addUserToAudience from './addUserToAudience'
import removeUserFromAudience from './removeUserFromAudience'

const destination: DestinationDefinition<Settings> = {
  name: 'Criteo Audiences',
  slug: 'criteo-managing-audiences',
  description: 'Add/remove users to/from Criteo Audiences using Criteo API',
  mode: 'cloud',
  authentication: {
    scheme: 'custom',
    fields: {
      client_id: {
        label: 'API Client ID',
        description: 'Your Criteo API client ID',
        type: 'string',
        required: true
      },
      client_secret: {
        label: 'API Client Secret',
        description: 'Your Criteo API client secret',
        type: 'string',
        required: true
      },
      advertiser_id: {
        label: 'Advertiser ID',
        description: 'Your Criteo Advertiser ID',
        type: 'string',
        required: true
      }
    },
    testAuthentication: async (request, { settings }) => {
      const res = await request(`https://api.criteo.com/oauth2/token`, {
        method: 'post',
        body: new URLSearchParams({
          client_id: encodeURIComponent(settings.client_id),
          client_secret: encodeURIComponent(settings.client_secret),
          grant_type: 'client_credentials'
        }),
        headers: {
          'Accept': 'text/plain',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
      })

      return { accessToken: res.data.access_token }
    }
  },
  extendRequest: ({ auth }) => {
    return {
      headers: { Authorization: `Bearer ${auth?.accessToken}` }
    }
  },
  //we might not need this function
  /*onDelete: async (request, { settings, payload }) => {
    // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
    // provided in the payload. If your destination does not support GDPR deletion you should not
    // implement this function and should remove it completely.
  },*/

  actions: {
    addUserToAudience,
    removeUserFromAudience
  }
}

export default destination

import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

// import track from './track'

const destination: DestinationDefinition<Settings> = {
  name: 'Drip',
  slug: 'actions-drip',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        type: 'string',
        label: 'API Key', // TODO: base64 encode
        description: 'Your Drip API Key',
        required: true
      }
    },

    testAuthentication: async (request, { settings }) => {
      return await request('https://api-staging.getdrip.com/v2/user', {
        method: 'GET',
        headers: {
          Authorization: `Basic ${settings.apiKey}`
        }
      })
    }
  },

  onDelete: async (request, { settings, payload }) => {
    // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
    // provided in the payload. If your destination does not support GDPR deletion you should not
    // implement this function and should remove it completely.
  },

  actions: {
    // track
  }
}

export default destination

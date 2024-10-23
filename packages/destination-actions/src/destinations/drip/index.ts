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
        label: 'API Key',
        description: 'Your Drip API Key',
        required: true
      }
    },

    testAuthentication: async (request, { settings }) => {
      const encodedApiKey = Buffer.from(`${settings.apiKey}:`).toString('base64')

      return await request('https://api-staging.getdrip.com/v2/user', {
        method: 'GET',
        headers: {
          Authorization: `Basic ${encodedApiKey}`
        }
      })
    }
  },

  actions: {
    // track
  }
}

export default destination

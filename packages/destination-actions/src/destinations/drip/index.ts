import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import { baseUrl } from './constants'

import track from './track'

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
        description: 'API key for your Drip account. You can find this in your Drip account settings.',
        required: true
      }
    },

    testAuthentication: async (request, { settings }) => {
      const encodedApiKey = Buffer.from(`${settings.apiKey}:`).toString('base64')

      return await request(`${baseUrl}/v2/user`, {
        method: 'GET',
        headers: {
          Authorization: `Basic ${encodedApiKey}`
        }
      })
    }
  },

  actions: {
    track
  }
}

export default destination

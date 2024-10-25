import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import { baseUrl, headers } from './utils'

import track from './track'
import identify from './identify'

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
      return await request(`${baseUrl}/v2/user`, {
        method: 'GET',
        headers: headers(settings)
      })
    }
  },

  actions: {
    track,
    identify
  }
}

export default destination

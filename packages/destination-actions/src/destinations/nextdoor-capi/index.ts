import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import sendConversion from './sendConversion'

const destination: DestinationDefinition<Settings> = {
  name: 'Nextdoor Conversions API',
  slug: 'actions-nextdoor-capi',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'The Embed API Key for your account. You can find this on your settings pages.',
        type: 'password',
        required: true
      }
    },
    testAuthentication: async (request, { settings }) => {
      return await request('https://ads.nextdoor.com/v2/api/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${settings.apiKey}`,
          'Content-Type': 'application/json'
        }
      })
    }
  },

  actions: {
    sendConversion
  }
}

export default destination

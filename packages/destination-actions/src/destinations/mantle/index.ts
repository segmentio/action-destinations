import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import pushEvent from './pushEvent'
import identify from './identify'
import { API_URL } from './config'

const destination: DestinationDefinition<Settings> = {
  name: 'Mantle (Actions)',
  description:
    'Track important revenue metrics for your Shopify apps. Manage plans and pricing. Improve customer relationships. Focus on growing your business.',
  slug: 'actions-mantle',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      appId: {
        label: 'App ID',
        description:
          'The unique identifier for the app in Mantle. Get this from the API Keys section for your app in Mantle.',
        type: 'string',
        required: true
      },
      apiKey: {
        label: 'API Key',
        description: 'The API key for the app in Mantle. Get this from the API Keys section for your app in Mantle.',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request) => {
      return request(`${API_URL}/app`, {
        method: 'GET'
      })
    }
  },

  extendRequest: ({ settings }) => {
    return {
      headers: {
        'x-mantle-app-id': settings.appId,
        'x-mantle-app-api-key': settings.apiKey
      }
    }
  },

  actions: {
    pushEvent,
    identify
  }
}

export default destination

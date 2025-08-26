import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import asyncOperation from './asyncOperation'

const destination: DestinationDefinition<Settings> = {
  name: 'Example Async Destination',
  slug: 'actions-example-async',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      endpoint: {
        label: 'API Endpoint',
        description: 'The base URL for the destination API',
        type: 'string',
        required: true
      },
      api_key: {
        label: 'API Key',
        description: 'API key for authentication',
        type: 'password',
        required: true
      }
    }
  },

  extendRequest({ settings }) {
    return {
      headers: {
        Authorization: `Bearer ${settings.api_key}`,
        'Content-Type': 'application/json'
      }
    }
  },

  actions: {
    asyncOperation
  }
}

export default destination

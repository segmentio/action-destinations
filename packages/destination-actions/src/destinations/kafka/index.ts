import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import send from './send'

const destination: DestinationDefinition<Settings> = {
  name: 'Kafka',
  slug: 'actions-kafka',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'The API key for your Kafka instance.',
        type: 'string',
        required: true
      }
    }
    // testAuthentication: (request) => {
    //   // Return a request that tests/validates the user's credentials.
    //   // If you do not have a way to validate the authentication fields safely,
    //   // you can remove the `testAuthentication` function, though discouraged.
    // }
  },

  extendRequest: ({ settings }) => {
    return {
      headers: {
        Authorization: `Bearer ${settings.apiKey}`
      }
    }
  },

  actions: {
    send
  }
}

export default destination

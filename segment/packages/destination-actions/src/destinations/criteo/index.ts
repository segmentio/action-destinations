import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import exampleAction from './exampleAction'

const destination: DestinationDefinition<Settings> = {
  name: 'Criteo',
  slug: 'actions-criteo',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    // Define any authentication-related fields here that customers need to provide
    // For example, `api_key`, `subdomain`, etc.
    fields: {
      // Feel free to remove/replace this example field
      api_key: {
        label: 'API Key',
        description: 'Your Criteo API key',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (_request) => {
      // Return a request that tests/validates the user's credentials.
      // If you do not have a way to validate the authentication fields safely,
      // you can remove the `testAuthentication` function, though discouraged.
    }
  },

  // You can use `extendRequest` to provide options for the request client instance
  // provided to all actions
  extendRequest: ({ settings }) => {
    return {
      headers: { Authorization: `Bearer ${settings.api_key}` }
    }
  },

  actions: {
    exampleAction
  }
}

export default destination

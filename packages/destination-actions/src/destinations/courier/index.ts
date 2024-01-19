import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import postToCourier from './postToCourier'

const destination: DestinationDefinition<Settings> = {
  name: 'Courier',
  slug: 'actions-courier',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Courier API Key from Segment integration page',
        type: 'string',
        required: true
      },
      region: {
        label: 'Region',
        description: 'Courier Region (US or EU)',
        type: 'string',
        default: 'US',
        choices: [
          {
            value: 'US',
            label: 'US'
          },
          {
            value: 'EU',
            label: 'EU'
          }
        ],
        required: true
      }
    },
    testAuthentication: (request) => {
      // Return a request that tests/validates the user's credentials.
      // If you do not have a way to validate the authentication fields safely,
      // you can remove the `testAuthentication` function, though discouraged.
      return true
    }
  },

  onDelete: async (request, { settings, payload }) => {
    // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
    // provided in the payload. If your destination does not support GDPR deletion you should not
    // implement this function and should remove it completely.
    return true
  },

  actions: {
    postToCourier
  }
}

export default destination

import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { IntegrationError } from '@segment/actions-core'

import identifyUser from './identifyUser'

import trackEvent from './trackEvent'

const destination: DestinationDefinition<Settings> = {
  name: 'Usermaven',
  slug: 'actions-usermaven',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        type: 'string',
        label: 'API Key',
        description: 'Found on your settings page.',
        required: true
      },
      serverToken: {
        type: 'string',
        label: 'Server Token',
        description: 'Found on your settings page.',
        required: true
      }
    },
    testAuthentication: (_, { settings }) => {
      // Return a request that tests/validates the user's credentials.
      // If you do not have a way to validate the authentication fields safely,
      // you can remove the `testAuthentication` function, though discouraged.
      if (
        !settings.apiKey ||
        !settings.serverToken ||
        settings.apiKey.length === 0 ||
        settings.serverToken.length === 0
      ) {
        throw new IntegrationError('One or more authentication fields are missing.', 'Misconfigured field', 400)
      }
    }
  },

  // onDelete: async (request, { settings, payload }) => {
  //   // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
  //   // provided in the payload. If your destination does not support GDPR deletion you should not
  //   // implement this function and should remove it completely.
  // },

  actions: {
    identifyUser,
    trackEvent
  }
}

export default destination

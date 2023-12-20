import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import trackEvent from './trackEvent'

import identifyUser from './identifyUser'

const destination: DestinationDefinition<Settings> = {
  name: 'Schematic',
  slug: 'actions-schematic',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        type: 'string',
        label: 'API Key',
        description: 'Found on your settings page.',
        required: true
      }
    }
    /*testAuthentication: (request) => {
      // Return a request that tests/validates the user's credentials.
      // If you do not have a way to validate the authentication fields safely,
      // you can remove the `testAuthentication` function, though discouraged.
    }*/
  },

  /*onDelete: async (request, { settings, payload }) => {
    // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
    // provided in the payload. If your destination does not support GDPR deletion you should not
    // implement this function and should remove it completely.
  },*/

  actions: {
    trackEvent,
    identifyUser
  },

  extendRequest: ({ settings }) => {
    return {
      prefixUrl: `https://api.schematichq.com/events`,
      headers: { Authorization: `Bearer ${settings.apiKey}` },
      responseType: 'json'
    }
  }
}

export default destination

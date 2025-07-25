import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import sendEvent from './sendEvent'

import pageLoad from './pageLoad'

const destination: DestinationDefinition<Settings> = {
  name: 'Ms Bing Capi',
  slug: 'actions-ms-bing-capi',
  mode: 'cloud',

  authentication: {
    scheme: 'basic',
    fields: {
      ApiToken: {
        label: 'Bing ApiToken',
        description: 'Your Bing API Token.',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request) => {
      // Return a request that tests/validates the user's credentials.
      // If you do not have a way to validate the authentication fields safely,
      // you can remove the `testAuthentication` function, though discouraged.
    }
  },

  extendRequest({ settings }) {
    return {
      username: settings.username,
      password: settings.password
    }
  },

  onDelete: async (request, { settings, payload }) => {
    // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
    // provided in the payload. If your destination does not support GDPR deletion you should not
    // implement this function and should remove it completely.
  },

  actions: {
    sendEvent,
    pageLoad
  }
}

export default destination

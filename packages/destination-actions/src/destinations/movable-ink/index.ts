import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import sendAnalyticsEvent from './sendAnalyticsEvent'

const destination: DestinationDefinition<Settings> = {
  name: 'Movable Ink',
  slug: 'actions-movable-ink',
  mode: 'cloud',

  authentication: {
    scheme: 'basic',
    fields: {
      username: {
        label: 'Username',
        description: 'Your Movable Ink username',
        type: 'string',
        required: true
      },
      password: {
        label: 'password',
        description: 'Your Movable Ink password.',
        type: 'string',
        required: true
      },
      movableInkURL: {
        label: 'password',
        description: 'The Movable Ink URL to send data to.',
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
    sendAnalyticsEvent
  }
}

export default destination

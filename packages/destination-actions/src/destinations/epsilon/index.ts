import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import send from './appOpen'

const destination: DestinationDefinition<Settings> = {
  name: 'Epsilon (Actions)',
  slug: 'actions-epsilon',
  mode: 'cloud',
  description: 'Sync analytics events and user profile details to Epsilon',

  authentication: {
    scheme: 'basic',
    fields: {
      username: {
        label: 'Username',
        description: 'Your Epsilon username',
        type: 'string',
        required: true
      },
      password: {
        label: 'password',
        description: 'Your Epsilon password.',
        type: 'string',
        required: true
      },
      companyId: {
        label: 'Company ID',
        description: 'Your Company ID. Contact Epsilon support for assistance.',
        type: 'number',
        required: true
      },
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
    send
  }
}

export default destination

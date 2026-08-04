import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import send from './send'

const destination: DestinationDefinition<Settings> = {
  name: 'Mdkhan Destination',
  slug: 'actions-mdkhan-destination',
  mode: 'cloud',

  authentication: {
    scheme: 'basic',
    fields: {
      username: {
        label: 'Username',
        description: 'Your Mdkhan Destination username',
        type: 'string',
        required: true
      },
      password: {
        label: 'password',
        description: 'Your Mdkhan Destination password.',
        type: 'string',
        required: true
      }
    },
    testAuthentication: () => {
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

  onDelete: async () => {
    // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
    // provided in the payload. If your destination does not support GDPR deletion you should not
    // implement this function and should remove it completely.
  },

  actions: {
    send
  }
}

export default destination

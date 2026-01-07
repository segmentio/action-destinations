import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import profileSync from './profileSync'
import traitsSync from './traitsSync'

const destination: DestinationDefinition<Settings> = {
  name: 'Memora',
  slug: 'actions-memora',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {},
    testAuthentication: (_request) => {
      // Return a request that tests/validates the user's credentials.
      // If you do not have a way to validate the authentication fields safely,
      // you can remove the `testAuthentication` function, though discouraged.
      return true
    }
  },

  onDelete: async (_request, { settings: _settings, payload: _payload }) => {
    // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
    // provided in the payload. If your destination does not support GDPR deletion you should not
    // implement this function and should remove it completely.
    return true
  },

  actions: {
    profileSync,
    traitsSync
  }
}

export default destination

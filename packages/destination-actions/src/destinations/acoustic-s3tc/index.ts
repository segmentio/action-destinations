import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import receiveEvents from './receiveEvents'

const destination: DestinationDefinition<Settings> = {
  name: 'Acoustic S3tc',
  slug: 'actions-acoustic-s3tc',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {},
    testAuthentication: (request) => {
      request
      // Return a request that tests/validates the user's credentials.
      // If you do not have a way to validate the authentication fields safely,
      // you can remove the `testAuthentication` function, though discouraged.
    }
  },

  onDelete: async (request, { settings, payload }) => {
    request
    settings
    payload
    // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
    // provided in the payload. If your destination does not support GDPR deletion you should not
    // implement this function and should remove it completely.
  },

  actions: {
    receiveEvents
  }
}

export default destination

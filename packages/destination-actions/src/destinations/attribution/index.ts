import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import send from './send'

const destination: DestinationDefinition<Settings> = {
  name: 'Attribution',
  slug: 'actions-attribution',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      projectID: {
        label: 'Project ID',
        description: 'Your Attribution project ID.',
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
    const { projectID } = settings
    return {
      headers: {
        Authorization: `Basic ${Buffer.from(':' + projectID).toString('base64')}`,
      }
    }
  },
  actions: {
    send
  }
}

export default destination

import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

const destination: DestinationDefinition<Settings> = {
  name: '{{name}}',
  authentication: {
    scheme: 'custom',
    fields: {},
    testAuthentication: (_request) => {
      // Return a request that tests/validates the user's authentication fields here
    }
  },
  actions: {}
}

export default destination

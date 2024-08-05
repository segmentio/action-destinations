import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import sendConversion from './sendConversion'

const destination: DestinationDefinition<Settings> = {
  name: 'Nextdoor Conversions API',
  slug: 'actions-nextdoor-capi',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'The Embed API Key for your account. You can find this on your settings pages.',
        type: 'password',
        required: true
      }
    },
    testAuthentication: (request) => {
      // Return a request that tests/validates the user's credentials.
      // If you do not have a way to validate the authentication fields safely,
      // you can remove the `testAuthentication` function, though discouraged.
    }
  },

  actions: {
    sendConversion
  }
}

export default destination

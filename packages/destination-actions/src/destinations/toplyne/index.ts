import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import sendUserProfiles from './sendUserProfiles'

import sendAccountProfiles from './sendAccountProfiles'

import sendEvents from './sendEvents'

const destination: DestinationDefinition<Settings> = {
  name: 'Toplyne',
  slug: 'toplyne',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        type: 'string',
        label: 'API Key',
        description: 'Your Toplyne API Key',
        required: true
      }
    },
    testAuthentication: (request) => {
      console.log(request)
      // Return a request that tests/validates the user's credentials.
      // If you do not have a way to validate the authentication fields safely,
      // you can remove the `testAuthentication` function, though discouraged.
    }
  },

  extendRequest: ({ settings }) => {
    return {
      headers: {
        Authorization: `Bearer ${settings.apiKey}`
      },
      method: 'POST'
    }
  },

  actions: {
    sendUserProfiles,
    sendAccountProfiles,
    sendEvents
  }
}

export default destination

import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import createAudience from './createAudience'

const destination: DestinationDefinition<Settings> = {
  name: 'Talon One',
  slug: 'talon-one',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      api_key: {
        label: 'API Key',
        description: 'Created under Developer Settings in the Talon.One Campaign Manager.',
        type: 'string',
        required: true
      },
      deployment: {
        type: 'string',
        label: 'Deployment',
        description: 'The base URL of your Talon.One deployment.',
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      // Return a request that tests/validates the user's credentials.
      // If you do not have a way to validate the authentication fields safely,
      // you can remove the `testAuthentication` function, though discouraged.
      return request(`${settings.deployment}/v2/authping`, { method: 'GET' })
    }
  },

  extendRequest({ settings }) {
    return {
      headers: {
        Authorization: `ApiKey-v1 ${settings.api_key}`,
        'destination-hostname': `${settings.deployment}`
      }
    }
  },

  actions: {
    createAudience
  }
}

export default destination

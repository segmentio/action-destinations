import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { DEFAULT_REQUEST_TIMEOUT } from '@segment/actions-core'
import upsertContactProfile from './upsertContactProfile'

const destination: DestinationDefinition<Settings> = {
  name: 'Ortto',
  slug: 'actions-ortto',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      api_key: {
        label: 'API Key',
        description: 'Ortto API key',
        type: 'password',
        required: true
      },
      region: {
        label: 'Region',
        description: 'The region where your Ortto account lives.',
        type: 'string',
        choices: [
          { label: 'AU', value: 'au' },
          { label: 'EU', value: 'eu' },
          { label: 'US', value: 'us' },
          { label: 'Local', value: 'local' }
        ],
        default: 'local',
        required: true
      }
    },
    testAuthentication: (request) => {
      // Return a request that tests/validates the user's credentials.
      // If you do not have a way to validate the authentication fields safely,
      // you can remove the `testAuthentication` function, though discouraged.
      return true
    }
  },

  onDelete: async (request, { settings, payload }) => {
    // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
    // provided in the payload. If your destination does not support GDPR deletion you should not
    // implement this function and should remove it completely.
    return true
  },
  extendRequest({ settings }) {
    return {
      headers: {
        Authorization: `Bearer ${settings.api_key}`
      },
      timeout: Math.max(30_000, DEFAULT_REQUEST_TIMEOUT)
    }
  },
  actions: {
    upsertContactProfile
  }
}

export default destination

import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { API_BASE, VERIFICATION_PATH } from './insider-helper'

const destination: DestinationDefinition<Settings> = {
  name: 'Insider',
  slug: 'actions-insider',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      account_name: {
        label: 'Insider Account Name',
        description:
          'Insider Account Name is your account name which you can find under Account Preferences at InOne Settings.',
        type: 'string',
        required: true
      },
      ucd_token: {
        label: 'Insider Token',
        description: 'Insider Token is your token which you can find under Account Preferences at InOne Settings.',
        type: 'password',
        required: true
      }
    },
    testAuthentication: async (request) => {
      return await request(`${API_BASE}${VERIFICATION_PATH}`)
      // Return a request that tests/validates the user's credentials.
      // If you do not have a way to validate the authentication fields safely,
      // you can remove the `testAuthentication` function, though discouraged.
    }
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onDelete: async (request, { settings, payload }) => {
    // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
    // provided in the payload. If your destination does not support GDPR deletion you should not
    // implement this function and should remove it completely.
  },

  actions: {}
}

export default destination

import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import upsertLead from './upsertLead'

import updateCompany from './updateCompany'

const destination: DestinationDefinition<Settings> = {
  name: 'Qualified',
  slug: 'actions-qualified',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      api_key: {
        label: 'API Key',
        description: 'Your Qualified API Key. When creating the API Key in Qualified make sure to select all scopes.',
        type: 'string',
        format: 'password',
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
    return {
      headers: {
        Authorization: `Bearer ${settings.api_key}`
      }
    }
  },
  actions: {
    upsertLead,
    updateCompany
  }
}

export default destination

import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import updateAudience from './updateAudience'

import addUserToAudience from './addUserToAudience'

import removeUserFromAudience from './removeUserFromAudience'

const destination: DestinationDefinition<Settings> = {
  name: 'Criteo Audiences',
  slug: 'criteo-managing-audiences',
  description: 'Add/remove users to/from Criteo Audiences using Criteo API',
  mode: 'cloud',
  authentication: {
    scheme: 'custom',
    fields: {
      client_id: {
        label: 'Client id',
        description: 'Your Criteo API client id',
        type: 'string',
        required: true
      },
      client_secret: {
        label: 'Client secret',
        description: 'Your Criteo API client secret',
        type: 'string',
        required: true
      },

      //although, advertiser id is not specifically used for authentication,
      //it's an input field needed for Audience API request
      advertiser_id: {
        label: 'Client id',
        description: 'Your Criteo API client id',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request) => {
      // Return a request that tests/validates the user's credentials.
      // If you do not have a way to validate the authentication fields safely,
      // you can remove the `testAuthentication` function, though discouraged.
      // write code to test Criteo Oauth
      return request('http://api.criteo.com/oauth2/token')
    }
  },

  //we might not need this function
  /*onDelete: async (request, { settings, payload }) => {
    // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
    // provided in the payload. If your destination does not support GDPR deletion you should not
    // implement this function and should remove it completely.
  },*/

  // You can use `extendRequest` to provide options for the request client instance
  // provided to all actions
  extendRequest: ({ settings }) => {
    return {
      headers: { Authorization: `Bearer ${settings.api_key}` }
    }
  },
  actions: {
    updateAudience,
    addUserToAudience,
    removeUserFromAudience
  }
}

export default destination

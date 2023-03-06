import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import sendEvent from './sendEvent'

import { baseURL, defaultRequestParams } from './request-params'

import identifyUser from './identifyUser'

const destination: DestinationDefinition<Settings> = {
  name: 'Gwen',
  slug: 'actions-gwen',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'GWEN API key. Can be found [here](http://gwen.insertcoin.se/iam/api-token)',
        type: 'password',
        required: true
      }
    },
    testAuthentication: (request) => {
      return request(baseURL, {
        ...defaultRequestParams,
        json: {
          operationName: 'ValidateAPIKey',
          query: `query ValidateAPIKey {
                validateApiKey
              }`
        }
      }).then(async (response) => {
        const { errors } = (await response.json()).data
        if (errors && errors.length > 0) {
          throw new Error('Invalid API key')
        }
      })
    }
  },
  extendRequest: ({ settings }) => {
    return {
      headers: {
        'Content-Type': 'application/json',
        Authorization: settings.apiKey
      }
    }
  },

  // onDelete: async (request, { settings, payload }) => {
  //   // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
  //   // provided in the payload. If your destination does not support GDPR deletion you should not
  //   // implement this function and should remove it completely.
  // },

  actions: {
    sendEvent,
    identifyUser
  }
}

export default destination

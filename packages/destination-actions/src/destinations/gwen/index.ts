import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import sendEvent from './sendEvent'

import { baseURL, defaultRequestParams } from './request-params'

import identifyUser from './identifyUser'

const destination: DestinationDefinition<Settings> = {
  name: 'GWEN (Actions)',
  slug: 'actions-cloud-gwen',
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
  actions: {
    sendEvent,
    identifyUser
  },
  presets: [
    {
      name: 'Send an event to GWEN',
      subscribe: 'type = "track"',
      partnerAction: 'sendEvent',
      mapping: defaultValues(sendEvent.fields)
    },
    {
      name: 'Identify a user',
      subscribe: 'type = "identify"',
      partnerAction: 'identifyUser',
      mapping: defaultValues(identifyUser.fields)
    }
  ]
}

export default destination

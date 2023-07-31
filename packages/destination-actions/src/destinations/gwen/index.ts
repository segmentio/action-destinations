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
        description: 'GWEN API key. Can be found [here](http://gwen.insertcoin.se/iam/api-token) (login required)',
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
        const { errors } = await response.json()
        if (errors && errors.length > 0) {
          throw new Error(
            'Invalid API key. Make sure you have the correct API key. If the problem persists please contant support@gwenplatform.com.'
          )
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
      mapping: defaultValues(sendEvent.fields),
      type: 'automatic'
    },
    {
      name: 'Identify a user',
      subscribe: 'type = "identify"',
      partnerAction: 'identifyUser',
      mapping: defaultValues(identifyUser.fields),
      type: 'automatic'
    }
  ]
}

export default destination

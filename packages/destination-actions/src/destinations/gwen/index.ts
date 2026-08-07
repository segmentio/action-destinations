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
      },
      // TEMPORARY bug-bash (required-field safety probe, scratch): a CONDITIONALLY-required auth field,
      // required only when apiKey === 'special'. Verifies whether the bot turns a conditional
      // requirement into a hard unconditional ['required'] validator in CP. Never merge.
      conditionalField: {
        label: 'Conditional Field',
        description: 'Only required when API Key is "special".',
        type: 'string',
        required: {
          match: 'all',
          conditions: [
            {
              fieldKey: 'apiKey',
              operator: 'is',
              value: 'special'
            }
          ]
        }
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

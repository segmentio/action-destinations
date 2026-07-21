import type { DestinationDefinition } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'

import createUsageEvent from './createUsageEvent'

const destination: DestinationDefinition<Settings> = {
  name: 'Lark',
  slug: 'actions-lark',
  mode: 'cloud',
  description: 'Send usage events to Lark for billing and metering purposes.',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Your Lark API key. You can find this in your Lark dashboard.',
        type: 'password',
        required: true
      }
    },
    testAuthentication: async (request, { settings }) => {
      // Test the API key by making a request to list subjects (a lightweight endpoint)
      // If the API key is invalid, this will return an error
      return request('https://api.uselark.ai/subjects', {
        method: 'get',
        headers: {
          'X-API-Key': settings.apiKey
        }
      })
    }
  },

  extendRequest({ settings }) {
    return {
      headers: {
        'X-API-Key': settings.apiKey,
        'Content-Type': 'application/json'
      }
    }
  },

  actions: {
    createUsageEvent
  },

  presets: [
    {
      name: 'Send Usage Event to Lark',
      subscribe: 'type = "track"',
      partnerAction: 'createUsageEvent',
      mapping: defaultValues(createUsageEvent.fields),
      type: 'automatic'
    }
  ]
}

export default destination

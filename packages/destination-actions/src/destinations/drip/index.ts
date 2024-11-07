import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import trackEvent from './trackEvent'

import identify from './identify'

const destination: DestinationDefinition<Settings> = {
  name: 'Drip',
  slug: 'drip',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'API key for your Drip account. You can find this in your Drip account settings.',
        type: 'string',
        required: true
      },
      endpoint: {
        label: 'Custom API Endpoint',
        description: 'The standard Drip API, the endpoint is https://api.getdrip.com/v2/.',
        type: 'string',
        required: false,
        default: 'https://api.getdrip.com/v2'
      },
      accountId: {
        label: 'Account ID',
        description: 'Account ID for your Drip account. You can find this in your Drip account settings.',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request) => {
      return request(`https://api.getdrip.com/v2/user`, {
        method: 'get'
      })
    }
  },

  extendRequest({ settings }) {
    return {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${settings.apiKey}`
      }
    }
  },

  // onDelete: async (request, { settings, payload }) => {
  //   // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
  //   // provided in the payload. If your destination does not support GDPR deletion you should not
  //   // implement this function and should remove it completely.
  // },

  actions: {
    trackEvent,
    identify
  }
}

export default destination

import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import customEvents from './customEvents'

import customAttributes from './customAttributes'

import productView from './productView'

import addToCart from './addToCart'

import purchase from './purchase'

const destination: DestinationDefinition<Settings> = {
  name: 'Attentive',
  slug: 'actions-attentive',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'API key used to authorize sending data to Attentive.',
        type: 'string',
        required: true
      }
    },
    testAuthentication: async (request, { settings }) => {
      // Return a request that tests/validates the user's credentials.
      // This example sends a test request to a sample endpoint.
      return request('https://api.attentivemobile.com/v1/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${settings.apiKey}`
        }
      })
    }
  },

  extendRequest({ settings }) {
    return {
      headers: {
        Authorization: `Bearer ${settings.apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  },

  actions: {
    customEvents,
    customAttributes,
    productView,
    addToCart,
    purchase
  }
}

export default destination

import { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import customEvents from './customEvents'

import purchase from './purchase'

import addToCart from './addToCart'

import productView from './productView'

const destination: DestinationDefinition<Settings> = {
  name: 'Attentive',
  slug: 'actions-attentive',
  mode: 'cloud',
  description: 'Send Segment analytics events to Attentive.',
  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Your Attentive API Key.',
        type: 'string',
        required: true
      }
    },
    testAuthentication: async (request, { settings }) => {
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
    purchase,
    addToCart,
    productView
  }
}

export default destination

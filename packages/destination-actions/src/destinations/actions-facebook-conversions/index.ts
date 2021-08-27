import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import purchase from './purchase'
import search from './search'
import pageView from './pageView'
import viewContent from './viewContent'
import addToCart from './addToCart'
import initiateCheckout from './initiateCheckout'
const destination: DestinationDefinition<Settings> = {
  name: 'Facebook Conversions',
  slug: 'actions-facebook-conversions',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      pixelId: {
        label: 'Pixel ID',
        description: 'The Pixel ID',
        type: 'string',
        required: true
      },
      token: {
        label: 'Token (TESTING ONLY)',
        description: 'Access Token, for testing purposes only, will not be included in final destination.',
        type: 'string',
        required: true
      }
    }
  },

  actions: {
    purchase,
    search,
    pageView,
    viewContent,
    addToCart,
    initiateCheckout
  }
}

export default destination

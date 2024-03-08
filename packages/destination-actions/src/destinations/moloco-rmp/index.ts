import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import home from './home'

import search from './search'

import addToWishlist from './addToWishlist'

import itemPageView from './itemPageView'

import pageView from './pageView'

import land from './land'

import purchase from './purchase'

import addToCart from './addToCart'

const destination: DestinationDefinition<Settings> = {
  name: 'Moloco Rmp',
  slug: 'actions-moloco-rmp',
  mode: 'cloud',
  description: 'This destination sends user events to Moloco RMP for machine learning and ad attribution.',
  authentication: {
    scheme: 'custom',
    fields: {
      platformId: {
        label: 'Platform ID',
        description: 'ID of the platform',
        type: 'string',
        required: true
      },
      apiKey: {
        label: 'API Key',
        description: 'The API key for the platform',
        type: 'password',
        required: true
      }
    },
  },

  actions: {
    home,
    search,
    addToWishlist,
    itemPageView,
    pageView,
    land,
    purchase,
    addToCart
  }
}

export default destination

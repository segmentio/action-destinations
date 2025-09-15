import type { DestinationDefinition } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
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
  name: 'Moloco MCM',
  slug: 'actions-moloco-rmp',
  mode: 'cloud',
  description: 'This destination sends user events to Moloco MCM for machine learning and ad attribution.',
  authentication: {
    scheme: 'custom',
    fields: {
      platformId: {
        label: 'Platform ID',
        description: 'ID of the platform',
        type: 'string',
        required: true
      },
      platformName: {
        label: 'Platform Name',
        description: 'Name of the platform (default to the `Platform ID`)',
        type: 'string',
        required: false,
        default: ''
      },
      apiKey: {
        label: 'API Key',
        description: 'The API key for the platform',
        type: 'password',
        required: true
      },
      channel_type: {
        label: 'Channel Type',
        description: 'Type of channel, either APP or SITE. Defaults to SITE.',
        type: 'string',
        required: true,
        choices: [
          { label: 'App', value: 'APP' },
          { label: 'Site', value: 'SITE' }
        ]
      }
    }
  },
  presets: [
    {
      name: 'Search',
      subscribe: 'type = "track" and event = "Products Searched"',
      partnerAction: 'search',
      mapping: defaultValues(search.fields),
      type: 'automatic'
    },
    {
      name: 'Purchase',
      subscribe: 'type = "track" and event = "Order Completed"',
      partnerAction: 'purchase',
      mapping: defaultValues(purchase.fields),
      type: 'automatic'
    },
    {
      name: 'Page View',
      subscribe: 'type = "page" and properties.name != "Home" and properties.name != "Land"',
      partnerAction: 'pageView',
      mapping: defaultValues(pageView.fields),
      type: 'automatic'
    },
    {
      name: 'Land',
      subscribe: 'type = "page" and properties.name = "Land"',
      partnerAction: 'land',
      mapping: defaultValues(land.fields),
      type: 'automatic'
    },
    {
      name: 'Item Page View',
      subscribe: 'type = "track" and event = "Product Viewed"',
      partnerAction: 'itemPageView',
      mapping: defaultValues(itemPageView.fields),
      type: 'automatic'
    },
    {
      name: 'Home',
      subscribe: 'type = "page" and properties.name = "Home"',
      partnerAction: 'home',
      mapping: defaultValues(home.fields),
      type: 'automatic'
    },
    {
      name: 'Add to Wishlist',
      subscribe: 'type = "track" and event = "Product Added to Wishlist"',
      partnerAction: 'addToWishlist',
      mapping: defaultValues(addToWishlist.fields),
      type: 'automatic'
    },
    {
      name: 'Add to Cart',
      subscribe: 'type = "track" and event = "Product Added"',
      partnerAction: 'addToCart',
      mapping: defaultValues(addToCart.fields),
      type: 'automatic'
    }
  ],
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

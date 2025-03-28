import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import { defaultValues } from '@segment/actions-core'
import { initializePixel } from './init-pixel'
import { RedditPixel } from './types'

import reportWebEvent from './reportWebEvent'

declare global {
  interface Window {
    rdt: RedditPixel
  }
}

export const destination: BrowserDestinationDefinition<Settings, RedditPixel> = {
  name: 'Reddit Pixel',
  slug: 'actions-reddit-pixel',
  mode: 'device',

  presets: [
    {
      name: 'Page Visit',
      subscribe: 'type = "page"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...defaultValues(reportWebEvent.fields),
        tracking_type: 'PageVisit',
        event_metadata: {}
      },
      type: 'automatic'
    },
    {
      name: 'View Content',
      subscribe: 'type = "track" and event = "Product Viewed"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...defaultValues(reportWebEvent.fields),
        tracking_type: 'ViewContent',
        event_metadata: {}
      },
      type: 'automatic'
    },
    {
      name: 'Search',
      subscribe: 'type = "track" and event = "Products Searched"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...defaultValues(reportWebEvent.fields),
        tracking_type: 'Search',
        event_metadata: {}
      },
      type: 'automatic'
    },
    {
      name: 'Add to Cart',
      subscribe: 'type = "track" and event = "Product Added"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...defaultValues(reportWebEvent.fields),
        tracking_type: 'AddToCart'
      },
      type: 'automatic'
    },
    {
      name: 'Add to Wishlist',
      subscribe: 'type = "track" and event = "Product Added to Wishlist"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...defaultValues(reportWebEvent.fields),
        tracking_type: 'AddToWishlist'
      },
      type: 'automatic'
    },
    {
      name: 'Purchase',
      subscribe: 'type = "track" and event = "Order Completed"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...defaultValues(reportWebEvent.fields),
        tracking_type: 'Purchase'
      },
      type: 'automatic'
    },
    {
      name: 'Lead',
      subscribe: 'type = "track" and event = "Lead Generated"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...defaultValues(reportWebEvent.fields),
        tracking_type: 'Lead',
        event_metadata: {
          currency: { '@path': '$.properties.currency' },
          value_decimal: { '@path': '$.properties.price' }
        }
      },
      type: 'automatic'
    },
    {
      name: 'Sign Up',
      subscribe: 'type = "track" and event = "Signed Up"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...defaultValues(reportWebEvent.fields),
        tracking_type: 'SignUp',
        event_metadata: {
          currency: { '@path': '$.properties.currency' },
          value_decimal: { '@path': '$.properties.price' }
        }
      },
      type: 'automatic'
    }
  ],

  settings: {
    // Add any Segment destination settings required here
    pixel_id: {
      label: 'Pixel ID',
      type: 'string',
      description: 'Your Reddit Pixel ID',
      required: true
    },
    ldu: {
      label: 'Limited Data Use',
      type: 'boolean',
      description: 'LDU'
    }
  },

  initialize: async ({ settings }, deps) => {
    initializePixel(settings)
    await deps.resolveWhen(() => window.rdt != null, 100)
    return window.rdt
  },

  actions: {
    reportWebEvent
  }
}

export default browserDestination(destination)

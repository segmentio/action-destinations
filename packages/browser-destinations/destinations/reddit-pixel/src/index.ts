import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import { defaultValues } from '@segment/actions-core'
import { initializePixel } from './init-pixel'
import { RedditPixel } from './types'

import reportWebEvent from './reportWebEvent'
import reportCustomWebEvent from './reportCustomWebEvent'

declare global {
  interface Window {
    rdt: RedditPixel
  }
}

export const destination: BrowserDestinationDefinition<Settings, RedditPixel> = {
  name: 'Reddit Pixel',
  slug: 'actions-reddit-pixel',
  mode: 'device',
  description:
    'The Reddit Pixel Browser Destination allows you to install the Reddit Javascript pixel onto your site and pass mapped Segment events and metadata to Reddit.',

  presets: [
    {
      name: 'Page Visit',
      subscribe: 'type = "page"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...defaultValues(reportWebEvent.fields),
        tracking_type: 'PageVisit'
      },
      type: 'automatic'
    },
    {
      name: 'View Content',
      subscribe: 'type = "track" and event = "Product Viewed"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...defaultValues(reportWebEvent.fields),
        tracking_type: 'ViewContent'
      },
      type: 'automatic'
    },
    {
      name: 'Search',
      subscribe: 'type = "track" and event = "Products Searched"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...defaultValues(reportWebEvent.fields),
        tracking_type: 'Search'
      },
      type: 'automatic'
    },
    {
      name: 'Add to Cart',
      subscribe: 'type = "track" and event = "Product Added"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...defaultValues(reportWebEvent.fields),
        tracking_type: 'AddToCart',
        event_metadata: {
          currency: { '@path': '$.properties.currency' },
          itemCount: { '@path': '$.properties.quantity' },
          value: { '@path': '$.properties.price' }
        }
      },
      type: 'automatic'
    },
    {
      name: 'Add to Wishlist',
      subscribe: 'type = "track" and event = "Product Added to Wishlist"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...defaultValues(reportWebEvent.fields),
        tracking_type: 'AddToWishlist',
        event_metadata: {
          currency: { '@path': '$.properties.currency' },
          itemCount: { '@path': '$.properties.quantity' },
          value: { '@path': '$.properties.price' }
        }
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
          value: { '@path': '$.properties.value' }
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
          value: { '@path': '$.properties.value' }
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
      default: false,
      description:
        'Limited Data Use - When the LDU flag is enabled, it may impact campaign performance and limit the size of targetable audiences. See [this documentation](https://business.reddithelp.com/s/article/Limited-Data-Use) for more information. If enabling this toggle, also go into each event and configure the Country and Region in the Data Processing Options for each event being sent.'
    }
  },

  initialize: async ({ settings }, deps) => {
    initializePixel(settings)
    await deps.resolveWhen(() => window.rdt != null, 100)
    return window.rdt
  },

  actions: {
    reportWebEvent,
    reportCustomWebEvent
  }
}

export default browserDestination(destination)

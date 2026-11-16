import { defaultValues, IntegrationError } from '@segment/actions-core'
import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import sendEvent from './sendEvent'

const baseMapping = defaultValues(sendEvent.fields)

const singleProductItems = {
  '@arrayPath': [
    '$.properties',
    {
      item_id: { '@path': '$.product_id' },
      item_name: { '@path': '$.name' },
      item_brand: { '@path': '$.brand' },
      item_variant_id: { '@path': '$.variant' },
      image_url: { '@path': '$.image_url' },
      price: { '@path': '$.price' },
      quantity: { '@path': '$.quantity' }
    }
  ]
}

const destination: DestinationDefinition<Settings> = {
  name: 'AppLovin Conversions API',
  slug: 'actions-applovin-conversions-api',
  mode: 'cloud',
  description: 'Send Segment events to the AppLovin Conversions API.',

  authentication: {
    scheme: 'custom',
    fields: {
      pixel_id: {
        label: 'Event Key',
        description:
          "Your AppLovin Event Key, found in the AppLovin Ads Manager under Keys. AppLovin's API documentation calls this the pixel ID, but it is the same value.",
        type: 'string',
        required: true
      }
    }
  },

  extendRequest() {
    const apiKey = process.env.ACTIONS_APPLOVIN_CONVERSIONS_API_KEY
    if (!apiKey) {
      throw new IntegrationError('AppLovin Conversions API key is not set', 'Configuration Error', 400)
    }
    return { headers: { Authorization: apiKey } }
  },

  presets: [
    {
      name: 'AppLovin Browser Plugin',
      subscribe: 'type = "track" or type = "identify" or type = "group" or type = "page" or type = "alias"',
      partnerAction: 'applovinPlugin',
      mapping: {},
      type: 'automatic'
    },
    {
      name: 'Page View',
      subscribe: 'type = "page"',
      partnerAction: 'sendEvent',
      mapping: { ...baseMapping, name: 'page_view' },
      type: 'automatic'
    },
    {
      name: 'View Item',
      subscribe: 'type = "track" and event = "Product Viewed"',
      partnerAction: 'sendEvent',
      mapping: { ...baseMapping, name: 'view_item', items: singleProductItems },
      type: 'automatic'
    },
    {
      name: 'Add to Cart',
      subscribe: 'type = "track" and event = "Product Added"',
      partnerAction: 'sendEvent',
      mapping: { ...baseMapping, name: 'add_to_cart', items: singleProductItems },
      type: 'automatic'
    },
    {
      name: 'Remove from Cart',
      subscribe: 'type = "track" and event = "Product Removed"',
      partnerAction: 'sendEvent',
      mapping: { ...baseMapping, name: 'remove_from_cart', items: singleProductItems },
      type: 'automatic'
    },
    {
      name: 'View Cart',
      subscribe: 'type = "track" and event = "Cart Viewed"',
      partnerAction: 'sendEvent',
      mapping: { ...baseMapping, name: 'view_cart' },
      type: 'automatic'
    },
    {
      name: 'Begin Checkout',
      subscribe: 'type = "track" and event = "Checkout Started"',
      partnerAction: 'sendEvent',
      mapping: { ...baseMapping, name: 'begin_checkout' },
      type: 'automatic'
    },
    {
      name: 'Add Payment Info',
      subscribe: 'type = "track" and event = "Payment Info Entered"',
      partnerAction: 'sendEvent',
      mapping: { ...baseMapping, name: 'add_payment_info' },
      type: 'automatic'
    },
    {
      name: 'Purchase',
      subscribe: 'type = "track" and event = "Order Completed"',
      partnerAction: 'sendEvent',
      mapping: {
        ...baseMapping,
        name: 'purchase',
        dedupe_id: { '@path': '$.properties.order_id' },
        value: {
          '@if': {
            exists: { '@path': '$.properties.subtotal' },
            then: { '@path': '$.properties.subtotal' },
            else: { '@path': '$.properties.value' }
          }
        }
      },
      type: 'automatic'
    },
    {
      name: 'Search',
      subscribe: 'type = "track" and event = "Products Searched"',
      partnerAction: 'sendEvent',
      mapping: { ...baseMapping, name: 'search' },
      type: 'automatic'
    },
    {
      name: 'Sign Up',
      subscribe: 'type = "track" and event = "Signed Up"',
      partnerAction: 'sendEvent',
      mapping: { ...baseMapping, name: 'sign_up' },
      type: 'automatic'
    },
    {
      name: 'Login',
      subscribe: 'type = "track" and event = "Signed In"',
      partnerAction: 'sendEvent',
      mapping: { ...baseMapping, name: 'login' },
      type: 'automatic'
    },
    {
      name: 'Generate Lead',
      subscribe: 'type = "track" and event = "Lead Generated"',
      partnerAction: 'sendEvent',
      mapping: { ...baseMapping, name: 'generate_lead' },
      type: 'automatic'
    },
    {
      name: 'Subscribe',
      subscribe: 'type = "track" and event = "Subscription Created"',
      partnerAction: 'sendEvent',
      mapping: { ...baseMapping, name: 'subscribe' },
      type: 'automatic'
    }
  ],

  actions: {
    sendEvent
  }
}

export default destination

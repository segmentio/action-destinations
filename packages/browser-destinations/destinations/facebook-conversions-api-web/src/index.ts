import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import send from './send'
import { initScript } from './init-script'
import { FBClient, LDU } from './types'
import { defaultValues } from '@segment/actions-core'

declare global {
  interface Window {
    fbq: FBClient
  }
}

export const destination: BrowserDestinationDefinition<Settings, FBClient> = {
  name: 'Facebook Conversions Api Web',
  slug: 'actions-facebook-conversions-api-web',
  mode: 'device',
  description: 'Send events to Facebook Conversions API from the browser.',
  settings: {
    pixelId: {
      description: 'The Pixel ID associated with your Facebook Pixel.',
      label: 'Pixel ID',
      type: 'string',
      required: true  
    },
    disablePushState: {
      description: "If set to true, prevents Facebook Pixel from sending PageView events on history state changes. Set to true if you want to trigger PageView events manually via the pageView Action.",
      label: 'Disable Push State',
      type: 'boolean'
    },
    ldu: {
      label: 'Limited Data User (LDU)',
      description: 'Specify if and how Limited Data Use should apply.',
      type: 'string',
      required: true,
      choices: [
        { label: 'LDU disabled', value: LDU.Disabled.key},
        { label: "LDU enabled - Use Meta Geolocation Logic", value: LDU.GeolocationLogic.key },
        { label: 'LDU enabled - California only', value: LDU.California.key },
        { label: 'LDU enabled - Colorado only', value: LDU.Colorado.key },
        { label: 'LDU enabled - Connecticut only', value: LDU.Connecticut.key },
        { label: 'LDU enabled - Florida only', value: LDU.Florida.key },
        { label: 'LDU enabled - Oregon only', value: LDU.Oregon.key },
        { label: 'LDU enabled - Texas only', value: LDU.Texas.key },
        { label: 'LDU enabled - Montana only', value: LDU.Montana.key },
        { label: 'LDU enabled - Delaware only', value: LDU.Delaware.key },
        { label: 'LDU enabled - Nebraska only', value: LDU.Nebraska.key },
        { label: 'LDU enabled - New Hampshire only', value: LDU.NewHampshire.key },
        { label: 'LDU enabled - New Jersey only', value: LDU.NewJersey.key },
        { label: 'LDU enabled - Minnesota only', value: LDU.Minnesota.key }
      ],
      default: LDU.Disabled.key
    }
  },
  initialize: async ({ settings }, deps) => {
    const { pixelId, disablePushState, ldu } = settings
    initScript(pixelId, ldu as keyof typeof LDU, disablePushState)
    await deps.resolveWhen(() => typeof window.fbq === 'function', 100)
    return window.fbq
  },

  actions: {
    send
  },
  presets: [
    {
      name: 'AddPaymentInfo',
      subscribe: 'event = "Payment Info Entered"',
      partnerAction: 'send',
      mapping: 
      { 
        ...defaultValues(send.fields),
        event_config: {
          event_name: 'AddPaymentInfo',
          custom_event_name: null,
          show_fields: false
        }
      },
      type: 'automatic'
    },
    {
      name: 'AddToCart',
      subscribe: 'event = "Product Added"',
      partnerAction: 'send',
      mapping: 
      { 
        ...defaultValues(send.fields),
        event_config: {
          event_name: 'AddToCart',
          custom_event_name: null,
          show_fields: false
        },
        content: {
          id: { '@path': '$.properties.product_id' },
          quantity: { '@path': '$.properties.quantity' },
          item_price: { '@path': '$.properties.price' }
        }
      },
      type: 'automatic'
    },    
    {
      name: 'AddToWishlist',
      subscribe: 'event = "Product Added To Wishlist"',
      partnerAction: 'send',
      mapping: 
      { 
        ...defaultValues(send.fields),
        event_config: {
          event_name: 'AddToWishlist',
          custom_event_name: null,
          show_fields: false
        },
        content: {
          id: { '@path': '$.properties.product_id' },
          quantity: { '@path': '$.properties.quantity' },
          item_price: { '@path': '$.properties.price' }
        }
      },
      type: 'automatic'
    },
    {
      name: 'CompleteRegistration',
      subscribe: 'event = "Signed Up"',
      partnerAction: 'send',
      mapping: 
      { 
        ...defaultValues(send.fields),
        event_config: {
          event_name: 'CompleteRegistration',
          custom_event_name: null,
          show_fields: false
        }
      },
      type: 'automatic'
    }, 
    {
      name: 'InitiateCheckout',
      subscribe: 'event = "Checkout Started"',
      partnerAction: 'send',
      mapping: 
      { 
        ...defaultValues(send.fields),
        event_config: {
          event_name: 'InitiateCheckout',
          custom_event_name: null,
          show_fields: false
        }
      },
      type: 'automatic'
    },
    {
      name: 'Purchase',
      subscribe: 'event = "Order Completed"',
      partnerAction: 'send',
      mapping: 
      { 
        ...defaultValues(send.fields),
        event_config: {
          event_name: 'Purchase',
          custom_event_name: null,
          show_fields: false
        }
      },
      type: 'automatic'
    },
    {
      name: 'Search',
      subscribe: 'event = "Products Searched"',
      partnerAction: 'send',
      mapping: 
      { 
        ...defaultValues(send.fields),
        event_config: {
          event_name: 'Search',
          custom_event_name: null,
          show_fields: false
        }
      },
      type: 'automatic'
    },
    {
      name: 'ViewContent',
      subscribe: 'event = "Product Viewed"',
      partnerAction: 'send',
      mapping: 
      { 
        ...defaultValues(send.fields),
        event_config: {
          event_name: 'ViewContent',
          custom_event_name: null,
          show_fields: false
        },
        content: {
          id: { '@path': '$.properties.product_id' },
          quantity: { '@path': '$.properties.quantity' },
          item_price: { '@path': '$.properties.price' }
        }
      },
      type: 'automatic'
    }
  ]
}

export default browserDestination(destination)

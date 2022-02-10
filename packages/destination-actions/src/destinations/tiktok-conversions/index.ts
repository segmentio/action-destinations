import type { DestinationDefinition, InputField } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'

import reportWebEvent from './reportWebEvent'

const tiktokDefaultValues = (fields: Record<string, InputField>, preset: string) => {
  let contents = {}
  const inner_contents = {
    price: {
      '@path': '$.price'
    },
    quantity: {
      '@path': '$.quantity'
    },
    content_type: {
      '@path': '$.category'
    },
    content_id: {
      '@path': '$.product_id'
    }
  }
  if (['AddToCart', 'AddToWishlist', 'Search', 'ViewContent'].includes(preset)) {
    contents = {
      '@arrayPath': [
        '$.properties',
        {
          ...inner_contents
        }
      ]
    }
  } else if (['AddPaymentInfo', 'InitiateCheckout', 'PlaceAnOrder'].includes(preset)) {
    contents = {
      '@arrayPath': [
        '$.properties.products',
        {
          ...inner_contents
        }
      ]
    }
  }

  return { ...defaultValues(fields), contents: contents }
}

/** used in the quick setup */
const presets: DestinationDefinition['presets'] = [
  {
    name: 'View Content',
    subscribe: 'type="page"',
    partnerAction: 'reportWebEvent',
    mapping: {
      ...tiktokDefaultValues(reportWebEvent.fields, 'ViewContent'),
      event: 'ViewContent'
    }
  },
  {
    name: 'Search',
    subscribe: 'event = "Products Searched"',
    partnerAction: 'reportWebEvent',
    mapping: {
      ...tiktokDefaultValues(reportWebEvent.fields, 'Search'),
      event: 'Search'
    }
  },
  {
    name: 'Add to Wishlist',
    subscribe: 'event = "Product Added to Wishlist"',
    partnerAction: 'reportWebEvent',
    mapping: {
      ...tiktokDefaultValues(reportWebEvent.fields, 'AddToWishlist'),
      event: 'AddToWishlist'
    }
  },
  {
    name: 'Add to Cart',
    subscribe: 'event = "Product Added"',
    partnerAction: 'reportWebEvent',
    mapping: {
      ...tiktokDefaultValues(reportWebEvent.fields, 'AddToCart'),
      event: 'AddToCart'
    }
  },
  {
    name: 'Initiate Checkout',
    subscribe: 'event = "Checkout Started"',
    partnerAction: 'reportWebEvent',
    mapping: {
      ...tiktokDefaultValues(reportWebEvent.fields, 'InitiateCheckout'),
      event: 'InitiateCheckout'
    }
  },
  {
    name: 'Add Payment Info',
    subscribe: 'event = "Payment Info Entered"',
    partnerAction: 'reportWebEvent',
    mapping: {
      ...tiktokDefaultValues(reportWebEvent.fields, 'AddPaymentInfo'),
      event: 'AddPaymentInfo'
    }
  },
  {
    name: 'Place an Order',
    subscribe: 'event = "Order Completed"',
    partnerAction: 'reportWebEvent',
    mapping: {
      ...tiktokDefaultValues(reportWebEvent.fields, 'PlaceAnOrder'),
      event: 'PlaceAnOrder'
    }
  }
]

const destination: DestinationDefinition<Settings> = {
  // Need to leave this Destination Name as "Tiktok" since it was registered with a lower case t.
  // The name here needs to match the value at creation time.
  // In Partner Portal, the name is changed to "TikTok" so it is spelled correctly in the catalog.
  name: 'Tiktok Conversions',
  slug: 'tiktok-conversions',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      access_token: {
        label: 'Access Token',
        description:
          'Your TikTok Access Token. Please see TikTok’s [Events API documentation](https://ads.tiktok.com/marketing_api/docs?id=1701890979375106) for information on how to generate an access token via the TikTok Ads Manager or API.',
        type: 'string',
        required: true
      },
      pixel_code: {
        label: 'Pixel Code',
        type: 'string',
        description:
          'Your TikTok Pixel ID. Please see TikTok’s [Events API documentation](https://ads.tiktok.com/marketing_api/docs?id=1701890979375106) for information on how to find this value.',
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      // Return a request that tests/validates the user's credentials.
      // Send a blank event to events API.
      return request('https://business-api.tiktok.com/open_api/v1.2/pixel/track/', {
        method: 'post',
        json: {
          pixel_code: settings.pixel_code,
          event: 'Test Event',
          timestamp: '',
          context: {}
        }
      })
    }
  },
  extendRequest({ settings }) {
    return {
      headers: { 'Access-Token': settings.access_token }
    }
  },
  presets,
  actions: {
    reportWebEvent
  }
}

export default destination

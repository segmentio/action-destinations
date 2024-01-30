import type { DestinationDefinition } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'

import reportWebEvent from './reportWebEvent'

const productProperties = {
  price: {
    '@path': '$.price'
  },
  quantity: {
    '@path': '$.quantity'
  },
  content_category: {
    '@path': '$.category'
  },
  content_id: {
    '@path': '$.product_id'
  },
  content_name: {
    '@path': '$.name'
  },
  brand: {
    '@path': '$.brand'
  }
}

const singleProductContents = {
  ...defaultValues(reportWebEvent.fields),
  contents: {
    '@arrayPath': [
      '$.properties',
      {
        ...productProperties
      }
    ]
  }
}

const multiProductContents = {
  ...defaultValues(reportWebEvent.fields),
  contents: {
    '@arrayPath': [
      '$.properties.products',
      {
        ...productProperties
      }
    ]
  }
}

const destination: DestinationDefinition<Settings> = {
  // Need to leave this Destination Name as "Tiktok" since it was registered with a lower case t.
  // The name here needs to match the value at creation time.
  // In Partner Portal, the name is changed to "TikTok" so it is spelled correctly in the catalog.
  name: 'Tiktok Conversions Sandbox',
  slug: 'tiktok-conversions-sandbox',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      accessToken: {
        label: 'Access Token',
        description:
          'Your TikTok Access Token. Please see TikTok’s [Events API documentation](https://ads.tiktok.com/marketing_api/docs?id=1701890979375106) for information on how to generate an access token via the TikTok Ads Manager or API.',
        type: 'string',
        required: true
      },
      pixelCode: {
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
      return request('https://business-api.tiktok.com/open_api/v1.3/pixel/track/', {
        method: 'post',
        json: {
          pixel_code: settings.pixelCode,
          event: 'Test Event',
          timestamp: '',
          context: {}
        }
      })
    }
  },
  extendRequest({ settings }) {
    return {
      headers: {
        'Access-Token': settings.accessToken,
        'Content-Type': 'application/json'
      }
    }
  },
  presets: [
    {
      name: 'Complete Payment',
      subscribe: 'event = "Payment Completed"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...multiProductContents,
        event: 'CompletePayment'
      },
      type: 'automatic'
    },
    {
      name: 'Contact',
      subscribe: 'event = "Callback Started"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...defaultValues(reportWebEvent.fields),
        event: 'Contact'
      },
      type: 'automatic'
    },
    {
      name: 'Subscribe',
      subscribe: 'event = "Subscription Created"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...defaultValues(reportWebEvent.fields),
        event: 'Subscribe'
      },
      type: 'automatic'
    },
    {
      name: 'Submit Form',
      subscribe: 'event = "Form Submitted"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...defaultValues(reportWebEvent.fields),
        event: 'SubmitForm'
      },
      type: 'automatic'
    },
    {
      name: 'Page View', // is it ok to change preset name that is used by live version?
      subscribe: 'type="page"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...multiProductContents,
        event: 'PageView'
      },
      type: 'automatic'
    },
    {
      name: 'View Content',
      subscribe: 'event = "Product Viewed"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...singleProductContents,
        event: 'ViewContent'
      },
      type: 'automatic'
    },
    {
      name: 'Click Button',
      subscribe: 'event = "Product Clicked"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...singleProductContents,
        event: 'ClickButton'
      },
      type: 'automatic'
    },
    {
      name: 'Search',
      subscribe: 'event = "Products Searched"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...singleProductContents,
        event: 'Search'
      },
      type: 'automatic'
    },
    {
      name: 'Add to Wishlist',
      subscribe: 'event = "Product Added to Wishlist"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...singleProductContents,
        event: 'AddToWishlist'
      },
      type: 'automatic'
    },
    {
      name: 'Add to Cart',
      subscribe: 'event = "Product Added"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...singleProductContents,
        event: 'AddToCart'
      },
      type: 'automatic'
    },
    {
      name: 'Initiate Checkout',
      subscribe: 'event = "Checkout Started"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...multiProductContents,
        event: 'InitiateCheckout'
      },
      type: 'automatic'
    },
    {
      name: 'Add Payment Info',
      subscribe: 'event = "Payment Info Entered"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...multiProductContents,
        event: 'AddPaymentInfo'
      },
      type: 'automatic'
    },
    {
      name: 'Place an Order',
      subscribe: 'event = "Order Completed"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...multiProductContents,
        event: 'PlaceAnOrder'
      },
      type: 'automatic'
    },
    {
      name: 'Download',
      subscribe: 'event = "Download Link Clicked"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...defaultValues(reportWebEvent.fields),
        event: 'Download'
      },
      type: 'automatic'
    },
    {
      name: 'Complete Registration',
      subscribe: 'event = "Signed Up"',
      partnerAction: 'reportWebEvent',
      mapping: {
        ...defaultValues(reportWebEvent.fields),
        event: 'CompleteRegistration'
      },
      type: 'automatic'
    }
  ],
  actions: {
    reportWebEvent
  }
}

export default destination

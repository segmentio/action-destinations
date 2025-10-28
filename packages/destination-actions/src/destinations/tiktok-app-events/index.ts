import { DestinationDefinition, defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'
import reportAppEvent from './reportAppEvent'

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
  ...defaultValues(reportAppEvent.fields),
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
  ...defaultValues(reportAppEvent.fields),
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
  name: 'TikTok App Events',
  slug: 'tiktok-app-events',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      accessToken: {
        label: 'Access Token',
        description:
          'Your TikTok Access Token. Please see TikTok’s [Events API documentation](https://ads.tiktok.com/marketing_api/docs?id=1701890979375106) for information on how to generate an access token via the TikTok Ads Manager or API.',
        type: 'password',
        required: true
      }
    },
    testAuthentication: (request ) => {
      // Return a request that tests/validates the user's credentials.
      // Send a blank event to events API.
      return request('https://business-api.tiktok.com/open_api/v1.3/pixel/track/', {
        method: 'post',
        json: {
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
      name: 'Install the app',
      subscribe: 'event = "Application Installed"',
      partnerAction: 'reportAppEvent',
      mapping: {
        ...defaultValues(reportAppEvent.fields),
        event: 'InstallApp'
      },
      type: 'automatic'
    },
    {
      name: 'Log in successfully',
      subscribe: 'event = "Signed In"',
      partnerAction: 'reportAppEvent',
      mapping: {
        ...defaultValues(reportAppEvent.fields),
        event: 'Login'
      },
      type: 'automatic'
    },
    {
      name: 'Complete Payment',
      subscribe: 'event = "Order Completed"',
      partnerAction: 'reportAppEvent',
      mapping: {
        ...multiProductContents,
        event: 'Purchase'
      },
      type: 'automatic'
    },    
    {
      name: 'Subscribe',
      subscribe: 'event = "Subscription Created"',
      partnerAction: 'reportAppEvent',
      mapping: {
        ...defaultValues(reportAppEvent.fields),
        event: 'Subscribe'
      },
      type: 'automatic'
    },
    {
      name: 'View Content',
      subscribe: 'event = "Product Viewed"',
      partnerAction: 'reportAppEvent',
      mapping: {
        ...singleProductContents,
        event: 'ViewContent'
      },
      type: 'automatic'
    },
    {
      name: 'Search',
      subscribe: 'event = "Products Searched"',
      partnerAction: 'reportAppEvent',
      mapping: {
        ...singleProductContents,
        event: 'Search'
      },
      type: 'automatic'
    },
    {
      name: 'Add to Wishlist',
      subscribe: 'event = "Product Added to Wishlist"',
      partnerAction: 'reportAppEvent',
      mapping: {
        ...singleProductContents,
        event: 'AddToWishlist'
      },
      type: 'automatic'
    },
    {
      name: 'Add to Cart',
      subscribe: 'event = "Product Added"',
      partnerAction: 'reportAppEvent',
      mapping: {
        ...singleProductContents,
        event: 'AddToCart'
      },
      type: 'automatic'
    },
    {
      name: 'Add Payment Info',
      subscribe: 'event = "Payment Info Entered"',
      partnerAction: 'reportAppEvent',
      mapping: {
        ...multiProductContents,
        event: 'AddPaymentInfo'
      },
      type: 'automatic'
    },
    {
      name: 'Place an Order',
      subscribe: 'event = "Order Placed"',
      partnerAction: 'reportAppEvent',
      mapping: {
        ...multiProductContents,
        event: 'Checkout'
      },
      type: 'automatic'
    },
    {
      name: 'Complete Registration',
      subscribe: 'event = "Signed Up"',
      partnerAction: 'reportAppEvent',
      mapping: {
        ...defaultValues(reportAppEvent.fields),
        event: 'Registration'
      },
      type: 'automatic'
    }
  ],
  actions: {
    reportAppEvent
  }
}

export default destination

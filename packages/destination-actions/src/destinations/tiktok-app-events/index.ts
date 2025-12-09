import { DestinationDefinition, defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'
import reportAppEvent from './reportAppEvent'

export const productProperties = {
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
      }, 
      appID: {
        label: 'TikTok App ID',
        type: 'string',
        description:
          'Your TikTok App ID. Please see TikTok’s [Events API documentation](https://ads.tiktok.com/marketing_api/docs?id=1701890979375106) for information on how to find this value.',
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      // Return a request that tests/validates the user's credentials.
      // Send a blank event to events API.
      return request('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
        method: 'post',
        json: {
          event_source: "app",
          event_source_id: settings.appID,
          data: []
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
      name: 'Complete payment',
      subscribe: 'event = "Order Completed"',
      partnerAction: 'reportAppEvent',
      mapping: {
        ...multiProductContents,
        event: 'Purchase'
      },
      type: 'automatic'
    },
    {
      name: 'Add payment information',
      subscribe: 'event = "Payment Info Entered"',
      partnerAction: 'reportAppEvent',
      mapping: {
        ...multiProductContents,
        event: 'AddPaymentInfo'
      },
      type: 'automatic'
    },
    {
      name: 'Place an order',
      subscribe: 'event = "Checkout Started"',
      partnerAction: 'reportAppEvent',
      mapping: {
        ...multiProductContents,
        event: 'Checkout'
      },
      type: 'automatic'
    },
    {
      name: 'Search',
      subscribe: 'event = "Products Searched"',
      partnerAction: 'reportAppEvent',
      mapping: {
         ...defaultValues(reportAppEvent.fields),
        event: 'Search'
      },
      type: 'automatic'
    },
    {
      name: 'View details',
      subscribe: 'event = "Product Viewed"',
      partnerAction: 'reportAppEvent',
      mapping: {
        ...singleProductContents,
        event: 'ViewContent'
      },
      type: 'automatic'
    },
    {
      name: 'Add to cart',
      subscribe: 'event = "Product Added"',
      partnerAction: 'reportAppEvent',
      mapping: {
        ...singleProductContents,
        event: 'AddToCart'
      },
      type: 'automatic'
    },
    {
      name: 'Add to wishlist',
      subscribe: 'event = "Product Added to Wishlist"',
      partnerAction: 'reportAppEvent',
      mapping: {
        ...singleProductContents,
        event: 'AddToWishlist'
      },
      type: 'automatic'
    },
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
      name: 'Launch the app',
      subscribe: 'event = "Application Opened"',
      partnerAction: 'reportAppEvent',
      mapping: {
         ...defaultValues(reportAppEvent.fields),
        event: 'LaunchAPP'
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
      name: 'Complete the registration',
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

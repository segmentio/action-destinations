import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import reportConversionEvent from './reportConversionEvent'

const defaultVals = { ...defaultValues(reportConversionEvent.fields) }

interface RefreshTokenResponse {
  access_token: string
}

/** Used in the Quick SetUp */
const presets: DestinationDefinition['presets'] = [
  {
    name: 'Add Billing',
    subscribe: 'event = "Payment Info Entered"',
    partnerAction: 'reportConversionEvent',
    mapping: {
      ...defaultVals,
      event_type: 'ADD_BILLING'
    }
  },
  {
    name: 'Add to Cart',
    subscribe: 'event = "Product Added"',
    partnerAction: 'reportConversionEvent',
    mapping: {
      ...defaultVals,
      event_type: 'ADD_CART'
    }
  },
  {
    name: 'Add to Wishlist',
    subscribe: 'event = "Product Added to Wishlist"',
    partnerAction: 'reportConversionEvent',
    mapping: {
      ...defaultVals,
      event_type: 'ADD_TO_WISHLIST'
    }
  },
  {
    name: 'App Install',
    subscribe: 'event = "Application Installed"',
    partnerAction: 'reportConversionEvent',
    mapping: {
      ...defaultVals,
      event_type: 'APP_INSTALL'
    }
  },
  {
    name: 'App Open',
    subscribe: 'event = "Application Opened"',
    partnerAction: 'reportConversionEvent',
    mapping: {
      ...defaultVals,
      event_type: 'APP_OPEN'
    }
  },
  // {
  //   name: 'List View',
  //   subscribe: 'event = "Product List Viewed"',
  //   partnerAction: 'reportConversionEvent',
  //   mapping: {
  //     ...defaultVals,
  //     event: 'LIST_VIEW'
  //   }
  // },
  {
    name: 'Login',
    subscribe: 'event = "Signed In"',
    partnerAction: 'reportConversionEvent',
    mapping: {
      ...defaultVals,
      event_type: 'LOGIN'
    }
  },
  {
    name: 'Page View',
    subscribe: 'type = "page"',
    partnerAction: 'reportConversionEvent',
    mapping: {
      ...defaultVals,
      event_type: 'PAGE_VIEW'
    }
  },
  {
    name: 'Purchase',
    subscribe: 'event = "Order Completed"',
    partnerAction: 'reportConversionEvent',
    mapping: {
      ...defaultVals,
      event_type: 'PURCHASE'
    }
  },
  {
    name: 'Search',
    subscribe: 'event = "Products Searched"',
    partnerAction: 'reportConversionEvent',
    mapping: {
      ...defaultVals,
      event_type: 'SEARCH'
    }
  },
  {
    name: 'Share',
    subscribe: 'event = "Product Shared"',
    partnerAction: 'reportConversionEvent',
    mapping: {
      ...defaultVals,
      event_type: 'SHARE'
    }
  },
  {
    name: 'Sign Up',
    subscribe: 'event = "Signed Up"',
    partnerAction: 'reportConversionEvent',
    mapping: {
      ...defaultVals,
      event_type: 'SIGN_UP'
    }
  },
  {
    name: 'Start Checkout',
    subscribe: 'event = "Checkout Started"',
    partnerAction: 'reportConversionEvent',
    mapping: {
      ...defaultVals,
      event_type: 'START_CHECKOUT'
    }
  },
  {
    name: 'View Content',
    subscribe: 'event = "Product Viewed"',
    partnerAction: 'reportConversionEvent',
    mapping: {
      ...defaultVals,
      event_type: 'VIEW_CONTENT'
    }
  }
]

const destination: DestinationDefinition<Settings> = {
  name: 'Snap Conversions Api',
  slug: 'actions-snap-conversions',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {
      pixel_id: {
        label: 'Pixel ID',
        description: 'The Pixel ID for your Snapchat Ad Account. Required for web and offline events.',
        type: 'string'
      },
      snap_app_id: {
        label: 'Snap App ID',
        description:
          'The Snap App ID associated with your app. This is a unique code generated in Snapchat Ads Manager and included in your MMP dashboard. Required for app events.',
        type: 'string'
      },
      app_id: {
        label: 'App ID',
        description:
          'The unique ID assigned for a given application. It should be numeric for iOS, and the human interpretable string for Android. Required for app events.',
        type: 'string'
      }
    },
    refreshAccessToken: async (request, { auth }) => {
      // Return a request that refreshes the access_token if the API supports it
      const res = await request<RefreshTokenResponse>('https://accounts.snapchat.com/login/oauth2/access_token', {
        method: 'POST',
        body: new URLSearchParams({
          refresh_token: auth.refreshToken,
          client_id: auth.clientId,
          client_secret: auth.clientSecret,
          grant_type: 'refresh_token'
        })
      })

      return { accessToken: res.data.access_token }
    }
  },
  extendRequest({ auth }) {
    return {
      headers: {
        authorization: `Bearer ${auth?.accessToken}`
      }
    }
  },
  presets,
  actions: {
    reportConversionEvent
  }
}

export default destination

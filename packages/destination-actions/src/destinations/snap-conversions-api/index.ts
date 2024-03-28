import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import reportConversionEvent from './reportConversionEvent'

const DEFAULT_VALS = {
  ...defaultValues(reportConversionEvent.fields)
}

const ACCESS_TOKEN_URL = 'https://accounts.snapchat.com/login/oauth2/access_token'

interface RefreshTokenResponse {
  access_token: string
}

const presets: DestinationDefinition['presets'] = [
  {
    name: 'Snap Browser Plugin',
    subscribe: 'type = "track" or type = "identify" or type = "group" or type = "page" or type = "alias"',
    partnerAction: 'snapPlugin',
    mapping: {},
    type: 'automatic'
  },
  {
    name: 'Add Billing',
    subscribe: 'event = "Payment Info Entered"',
    partnerAction: 'reportConversionEvent',
    mapping: {
      event_name: 'ADD_BILLING',
      action_source: 'website',
      ...DEFAULT_VALS
    },
    type: 'automatic'
  },
  {
    name: 'Add to Cart',
    subscribe: 'event = "Product Added"',
    partnerAction: 'reportConversionEvent',
    mapping: {
      event_name: 'ADD_CART',
      action_source: 'website',
      ...DEFAULT_VALS
    },
    type: 'automatic'
  },
  {
    name: 'Add to Wishlist',
    subscribe: 'event = "Product Added to Wishlist"',
    partnerAction: 'reportConversionEvent',
    mapping: {
      event_name: 'ADD_TO_WISHLIST',
      action_source: 'website',
      ...DEFAULT_VALS
    },
    type: 'automatic'
  },
  {
    name: 'App Install',
    subscribe: 'event = "Application Installed"',
    partnerAction: 'reportConversionEvent',
    mapping: {
      event_name: 'APP_INSTALL',
      action_source: 'website',
      ...DEFAULT_VALS
    },
    type: 'automatic'
  },
  {
    name: 'List View',
    subscribe: 'event = "Product List Viewed"',
    partnerAction: 'reportConversionEvent',
    mapping: {
      event_name: 'LIST_VIEW',
      action_source: 'website',
      ...DEFAULT_VALS
    },
    type: 'automatic'
  },
  {
    name: 'App Open',
    subscribe: 'event = "Application Opened"',
    partnerAction: 'reportConversionEvent',
    mapping: {
      event_name: 'APP_OPEN',
      action_source: 'website',
      ...DEFAULT_VALS
    },
    type: 'automatic'
  },
  {
    name: 'Login',
    subscribe: 'event = "Signed In"',
    partnerAction: 'reportConversionEvent',
    mapping: {
      event_name: 'LOGIN',
      action_source: 'website',
      ...DEFAULT_VALS
    },
    type: 'automatic'
  },
  {
    name: 'Page View',
    subscribe: 'type = "page"',
    partnerAction: 'reportConversionEvent',
    mapping: {
      event_name: 'PAGE_VIEW',
      action_source: 'website',
      ...DEFAULT_VALS
    },
    type: 'automatic'
  },
  {
    name: 'Purchase',
    subscribe: 'event = "Order Completed"',
    partnerAction: 'reportConversionEvent',
    mapping: {
      event_name: 'PURCHASE',
      action_source: 'website',
      ...DEFAULT_VALS
    },
    type: 'automatic'
  },
  {
    name: 'Search',
    subscribe: 'event = "Products Searched"',
    partnerAction: 'reportConversionEvent',
    mapping: {
      event_name: 'SEARCH',
      action_source: 'website',
      ...DEFAULT_VALS
    },
    type: 'automatic'
  },
  {
    name: 'Share',
    subscribe: 'event = "Product Shared"',
    partnerAction: 'reportConversionEvent',
    mapping: {
      event_name: 'SHARE',
      action_source: 'website',
      ...DEFAULT_VALS
    },
    type: 'automatic'
  },
  {
    name: 'Sign Up',
    subscribe: 'event = "Signed Up"',
    partnerAction: 'reportConversionEvent',
    mapping: {
      event_name: 'SIGN_UP',
      action_source: 'website',
      ...DEFAULT_VALS
    },
    type: 'automatic'
  },
  {
    name: 'Start Checkout',
    subscribe: 'event = "Checkout Started"',
    partnerAction: 'reportConversionEvent',
    mapping: {
      event_name: 'START_CHECKOUT',
      action_source: 'website',
      ...DEFAULT_VALS
    },
    type: 'automatic'
  },
  {
    name: 'View Content',
    subscribe: 'event = "Product Viewed"',
    partnerAction: 'reportConversionEvent',
    mapping: {
      event_name: 'VIEW_CONTENT',
      action_source: 'website',
      ...DEFAULT_VALS
    },
    type: 'automatic'
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
        description: 'The Pixel ID for your Snapchat Ad Account. **Required for web and offline events**.',
        type: 'string'
      },
      snap_app_id: {
        label: 'Snap App ID',
        description:
          'The Snap App ID associated with your app. This is a unique code generated in Snapchat Ads Manager and included in your MMP dashboard. **Required for app events**.',
        type: 'string'
      },
      app_id: {
        label: 'App ID',
        description:
          'The unique ID assigned for a given application. It should be numeric for iOS, and the human interpretable string for Android. **Required for app events**.',
        type: 'string'
      }
    },
    refreshAccessToken: async (request, { auth }) => {
      // Return a request that refreshes the access_token if the API supports it
      const res = await request<RefreshTokenResponse>(ACCESS_TOKEN_URL, {
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

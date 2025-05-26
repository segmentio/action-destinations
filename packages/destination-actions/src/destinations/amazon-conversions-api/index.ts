import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { Region, RefreshTokenResponse } from './types'
import { defaultValues, InvalidAuthenticationError } from '@segment/actions-core'
import { getAuthToken } from './utils'
import trackConversion from './trackConversion'

const destination: DestinationDefinition<Settings> = {
  name: 'Amazon Conversions Api',
  slug: 'amazon-conversions-api',
  mode: 'cloud',
  description: 'Send conversion events to Amazon Conversions API.',
  authentication: {
    scheme: 'oauth2',
    fields: {
      region: {
        label: 'Region',
        description: 'Region for API Endpoint, either NA, EU, FE.',
        choices: [
          { label: 'North America (NA)', value: Region.NA },
          { label: 'Europe (EU)', value: Region.EU },
          { label: 'Far East (FE)', value: Region.FE }
        ],
        default: Region.NA,
        type: 'string',
        required: true
      },
      advertiserId: {
        label: 'Amazon Advertiser ID',
        description: 'Your Amazon Advertiser Account ID.',
        type: 'string',
        required: true
      }
    },
    testAuthentication: async (request, { auth, settings }) => {
      if (!auth?.accessToken) {
        throw new InvalidAuthenticationError('Please authenticate via Oauth before enabling the destination.')
      }

      try {
        await request<RefreshTokenResponse>(`${settings.region}/v2/profiles`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 15000
        })
      } catch (error) {
        if (error.message === 'Unauthorized') {
          throw new InvalidAuthenticationError(
            'Invalid Amazon Oauth access token. Please reauthenticate to retrieve a valid access token before enabling the destination.'
          )
        }
        throw error
      }
    },
    refreshAccessToken: async (request, { auth }) => {
      return { accessToken: await getAuthToken(request, auth) }
    }
  },
  extendRequest({ auth }) {
    return {
      headers: {
        authorization: `Bearer ${auth?.accessToken}`,
        'Amazon-Advertising-API-ClientID': process.env.ACTIONS_AMAZON_CONVERSIONS_API_CLIENT_ID || ''
      }
    }
  },
  presets: [
    {
      name: 'Add to Shopping Cart',
      subscribe: 'type = "track" AND event = "Product Added"',
      partnerAction: 'trackConversion',
      mapping: {
        ...defaultValues(trackConversion.fields),
        eventType: 'ADD_TO_SHOPPING_CART'
      },
      type: 'automatic'
    },
    {
      name: 'Application',
      subscribe: 'type = "track" AND event = "Application Submitted"',
      partnerAction: 'trackConversion',
      mapping: {
        ...defaultValues(trackConversion.fields),
        eventType: 'APPLICATION'
      },
      type: 'automatic'
    },
    {
      name: 'Checkout',
      subscribe: 'type = "track" AND event = "Checkout"',
      partnerAction: 'trackConversion',
      mapping: {
        ...defaultValues(trackConversion.fields),
        eventType: 'CHECKOUT'
      },
      type: 'automatic'
    },
    {
      name: 'Contact',
      subscribe: 'type = "track" AND event = "Callback Started"',
      partnerAction: 'trackConversion',
      mapping: {
        ...defaultValues(trackConversion.fields),
        eventType: 'CONTACT'
      },
      type: 'automatic'
    },
    {
      name: 'Lead',
      subscribe: 'type = "track" AND event = "Generate Lead"',
      partnerAction: 'trackConversion',
      mapping: {
        ...defaultValues(trackConversion.fields),
        eventType: 'LEAD'
      },
      type: 'automatic'
    },
    {
      name: 'Off Amazon Purchases',
      subscribe: 'type = "track" AND event = "Purchase"',
      partnerAction: 'trackConversion',
      mapping: {
        ...defaultValues(trackConversion.fields),
        eventType: 'OFF_AMAZON_PURCHASES'
      },
      type: 'automatic'
    },
    {
      name: 'Mobile App First Start',
      subscribe: 'type = "track" AND event = "Launch Application"',
      partnerAction: 'trackConversion',
      mapping: {
        ...defaultValues(trackConversion.fields),
        eventType: 'MOBILE_APP_FIRST_START'
      },
      type: 'automatic'
    },
    {
      name: 'Page View',
      subscribe: 'type = "page"',
      partnerAction: 'trackConversion',
      mapping: {
        ...defaultValues(trackConversion.fields),
        eventType: 'PAGE_VIEW'
      },
      type: 'automatic'
    },
    {
      name: 'Search',
      subscribe: 'type = "track" AND event = "Products Searched"',
      partnerAction: 'trackConversion',
      mapping: {
        ...defaultValues(trackConversion.fields),
        eventType: 'SEARCH'
      },
      type: 'automatic'
    },
    {
      name: 'Sign Up',
      subscribe: 'type = "track" AND event = "Signed Up"',
      partnerAction: 'trackConversion',
      mapping: {
        ...defaultValues(trackConversion.fields),
        eventType: 'SIGN_UP'
      },
      type: 'automatic'
    },
    {
      name: 'Subscribe',
      subscribe: 'type = "track" AND event = "Subscription Created"',
      partnerAction: 'trackConversion',
      mapping: {
        ...defaultValues(trackConversion.fields),
        eventType: 'SUBSCRIBE'
      },
      type: 'automatic'
    }
  ],
  actions: {
    trackConversion
  }
}

export default destination

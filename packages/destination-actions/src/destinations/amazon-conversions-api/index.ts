import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import type { RefreshTokenResponse } from './types'

import { Region } from './types'
import { defaultValues, InvalidAuthenticationError } from '@segment/actions-core'
import { getAuthToken } from './utils'
import trackConversion from './trackConversion'
import { AMAZON_CONVERSIONS_API_PROFILES_VERSION } from './versioning-info'

const destination: DestinationDefinition<Settings> = {
  name: 'Amazon Conversions Api',
  slug: 'actions-amazon-conversions-api',
  description: 'Amazon conversion API destination to send conversion event data to Amazon.',
  mode: 'cloud',

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
        description:
          'Your Amazon Advertiser Account ID. This must be a numeric value. Use Amazon DSP CFID and not Entity ID.',
        type: 'string',
        required: true
      },
      dataSetName: {
        label: 'Dataset Name',
        description:
          'Amazon Ads organizes uploaded data into datasets, which are logical groupings used to separate and categorize events from your sources. All events within a dataset will appear in Amazon Ads Data Manager under the name you provide here. New destination? We recommend providing a dataset name during initial setup. Existing destination? We strongly recommend reading the [FAQ](https://www.twilio.com/docs/segment/connections/destinations/catalog/actions-amazon-conversions-api#what-is-a-dataset-and-how-does-amazon-use-the-dataset-name) before updating your dataset name, as changes may impact your existing events.',
        type: 'string',
        required: false,
        placeholder: 'Default_Events'
      }
    },
    testAuthentication: async (request, { auth, settings }) => {
      if (!auth?.accessToken) {
        throw new InvalidAuthenticationError('Please authenticate via Oauth before enabling the destination.')
      }

      const { dataSetName, advertiserId } = settings

      if (dataSetName && !/^[A-Za-z][A-Za-z0-9_-]{4,99}$/.test(dataSetName ?? '')) {
        throw new InvalidAuthenticationError(
          'Dataset Name must start with a letter and can only contain letters, numbers, underscores, or hyphens. It must be between 5 and 100 characters long.'
        )
      }

      if (!/^\d+$/.test(advertiserId)) {
        throw new InvalidAuthenticationError('Advertising ID must be numeric')
      }

      return await request<RefreshTokenResponse>(
        `${settings.region}/${AMAZON_CONVERSIONS_API_PROFILES_VERSION}/profiles`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Amazon-Advertising-API-ClientID': process.env.ACTIONS_AMAZON_CONVERSIONS_API_CLIENT_ID || ''
          },
          timeout: 2500
        }
      )
    },
    refreshAccessToken: async (request, { auth }) => {
      const authToken = await getAuthToken(request, auth)
      return { accessToken: authToken }
    }
  },
  extendRequest({ auth }) {
    return {
      headers: {
        authorization: `Bearer ${auth?.accessToken}`
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
      subscribe: 'type = "track" AND event = "Checkout Started"',
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
      subscribe: 'type = "track" AND event = "Lead Generated"',
      partnerAction: 'trackConversion',
      mapping: {
        ...defaultValues(trackConversion.fields),
        eventType: 'LEAD'
      },
      type: 'automatic'
    },
    {
      name: 'Off Amazon Purchases',
      subscribe: 'type = "track" AND event = "Order Completed"',
      partnerAction: 'trackConversion',
      mapping: {
        ...defaultValues(trackConversion.fields),
        eventType: 'OFF_AMAZON_PURCHASES'
      },
      type: 'automatic'
    },
    {
      name: 'Mobile App First Start',
      subscribe: 'type = "track" AND event = "Application Opened"',
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
    },
    {
      name: 'Other',
      subscribe: 'type = "track" AND event = "Other"',
      partnerAction: 'trackConversion',
      mapping: {
        ...defaultValues(trackConversion.fields),
        eventType: 'OTHER'
      },
      type: 'automatic'
    }
  ],
  actions: {
    trackConversion
  }
}

export default destination

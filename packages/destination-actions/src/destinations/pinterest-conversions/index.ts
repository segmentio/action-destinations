import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import { API_VERSION, EVENT_NAME } from './constants'
import type { Settings } from './generated-types'
import reportConversionEvent from './reportConversionEvent'
import type { PinterestConversionsTestAuthenticationError } from './types'

const destination: DestinationDefinition<Settings> = {
  name: 'Pinterest Conversions API',
  slug: 'actions-pinterest-conversions-api',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      ad_account_id: {
        label: 'Ad Account ID',
        description:
          'Unique identifier of an ad account. This can be found in the Pinterest UI by following the steps mentioned [here](https://developers.pinterest.com/docs/conversions/conversions/#Find%20your%20%2Cad_account_id).',
        type: 'string',
        required: true
      },
      conversion_token: {
        label: 'Conversion Token',
        description:
          'The conversion token for your Pinterest account. This can be found in the Pinterest UI by following the steps mentioned [here](https://developers.pinterest.com/docs/conversions/conversions/#Get%20the%20conversion%20token).',
        type: 'password',
        required: true
      }
    },
    testAuthentication: async (request, { settings }) => {
      // Return a request that tests/validates the user's credentials.
      try {
        return await request(
          `https://api.pinterest.com/${API_VERSION}/ad_accounts/${settings.ad_account_id}/events?test=true`,
          {
            method: 'POST',
            json: {
              data: [
                {
                  event_name: 'checkout',
                  action_source: 'app_ios',
                  event_time: Math.floor(Date.now() / 1000),
                  event_id: 'test_eventId',
                  user_data: {
                    em: ['411e44ce1261728ffd2c0686e44e3fffe413c0e2c5adc498bc7da883d476b9c8']
                  }
                }
              ]
            }
          }
        )
      } catch (err) {
        const error = err as PinterestConversionsTestAuthenticationError
        if (error.message === 'Unauthorized') {
          throw new Error('Invalid Conversion Token, please verify you have entered the correct Conversion Token.')
        } else if (error.message === 'Forbidden') {
          throw new Error('Invalid Ad Account ID, please verify you have entered the correct Ad Account ID.')
        }
        throw err
      }
    }
  },
  extendRequest({ settings }) {
    return {
      headers: { Authorization: `Bearer ${settings.conversion_token}` }
    }
  },
  presets: [
    {
      name: 'Add Payment Info',
      subscribe: 'type = "track" AND event = "Payment Info Entered"',
      partnerAction: 'reportConversionEvent',
      mapping: {
        ...defaultValues(reportConversionEvent.fields),
        event_name: EVENT_NAME.ADD_PAYMENT_INFO
      },
      type: 'automatic'
    },
    {
      name: 'Add to Cart',
      subscribe: 'type = "track" AND event = "Product Added"',
      partnerAction: 'reportConversionEvent',
      mapping: {
        ...defaultValues(reportConversionEvent.fields),
        event_name: EVENT_NAME.ADD_TO_CART
      },
      type: 'automatic'
    },
    {
      name: 'Add to Wishlist',
      subscribe: 'type = "track" AND event = "Product Added to Wishlist"',
      partnerAction: 'reportConversionEvent',
      mapping: {
        ...defaultValues(reportConversionEvent.fields),
        event_name: EVENT_NAME.ADD_TO_WISHLIST
      },
      type: 'automatic'
    },
    {
      name: 'App Install',
      subscribe: 'type = "track" AND event = "Application Installed"',
      partnerAction: 'reportConversionEvent',
      mapping: {
        ...defaultValues(reportConversionEvent.fields),
        event_name: EVENT_NAME.APP_INSTALL
      },
      type: 'automatic'
    },
    {
      name: 'App Open',
      subscribe: 'type = "track" AND event = "Application Opened"',
      partnerAction: 'reportConversionEvent',
      mapping: {
        ...defaultValues(reportConversionEvent.fields),
        event_name: EVENT_NAME.APP_OPEN
      },
      type: 'automatic'
    },
    {
      name: 'Checkout',
      subscribe: 'type = "track" AND event = "Checkout"',
      partnerAction: 'reportConversionEvent',
      mapping: {
        ...defaultValues(reportConversionEvent.fields),
        event_name: EVENT_NAME.CHECKOUT
      },
      type: 'automatic'
    },
    {
      name: 'Initiate Checkout',
      subscribe: 'type = "track" AND event = "Checkout Started"',
      partnerAction: 'reportConversionEvent',
      mapping: {
        ...defaultValues(reportConversionEvent.fields),
        event_name: EVENT_NAME.INITIATE_CHECKOUT
      },
      type: 'automatic'
    },
    {
      name: 'Lead',
      subscribe: 'type = "track" AND event = "Generate Lead"',
      partnerAction: 'reportConversionEvent',
      mapping: {
        ...defaultValues(reportConversionEvent.fields),
        event_name: EVENT_NAME.LEAD
      },
      type: 'automatic'
    },
    {
      name: 'Page Visit',
      subscribe: 'type = "page"',
      partnerAction: 'reportConversionEvent',
      mapping: {
        ...defaultValues(reportConversionEvent.fields),
        event_name: EVENT_NAME.PAGE_VISIT
      },
      type: 'automatic'
    },
    {
      name: 'Search',
      subscribe: 'type = "track" AND event = "Products Searched"',
      partnerAction: 'reportConversionEvent',
      mapping: {
        ...defaultValues(reportConversionEvent.fields),
        event_name: EVENT_NAME.SEARCH
      },
      type: 'automatic'
    },
    {
      name: 'Sign Up',
      subscribe: 'type = "track" AND event = "Signed Up"',
      partnerAction: 'reportConversionEvent',
      mapping: {
        ...defaultValues(reportConversionEvent.fields),
        event_name: EVENT_NAME.SIGNUP
      },
      type: 'automatic'
    },
    {
      name: 'Start Trial',
      subscribe: 'type = "track" AND event = "Trial Started"',
      partnerAction: 'reportConversionEvent',
      mapping: {
        ...defaultValues(reportConversionEvent.fields),
        event_name: EVENT_NAME.START_TRIAL
      },
      type: 'automatic'
    },
    {
      name: 'Subscribe',
      subscribe: 'type = "track" AND event = "Subscription Created"',
      partnerAction: 'reportConversionEvent',
      mapping: {
        ...defaultValues(reportConversionEvent.fields),
        event_name: EVENT_NAME.SUBSCRIBE
      },
      type: 'automatic'
    },
    {
      name: 'View Category',
      subscribe: 'type = "track" AND event = "Product Category Viewed"',
      partnerAction: 'reportConversionEvent',
      mapping: {
        ...defaultValues(reportConversionEvent.fields),
        event_name: EVENT_NAME.VIEW_CATEGORY
      },
      type: 'automatic'
    },
    {
      name: 'View Content',
      subscribe: 'type = "track" AND event = "Product Viewed"',
      partnerAction: 'reportConversionEvent',
      mapping: {
        ...defaultValues(reportConversionEvent.fields),
        event_name: EVENT_NAME.VIEW_CONTENT
      },
      type: 'automatic'
    },
    {
      name: 'Watch Video',
      subscribe: 'type = "track" AND event = "Product Video Watched"',
      partnerAction: 'reportConversionEvent',
      mapping: {
        ...defaultValues(reportConversionEvent.fields),
        event_name: EVENT_NAME.WATCH_VIDEO
      },
      type: 'automatic'
    }
  ],
  actions: {
    reportConversionEvent
  }
}

export default destination

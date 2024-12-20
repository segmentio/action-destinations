import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import { API_VERSION } from './constants'
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
                  event_time: 1678203524,
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
      name: 'Add to Cart',
      subscribe: 'type = "track" AND event = "Product Added"',
      partnerAction: 'reportConversionEvent',
      mapping: {
        ...defaultValues(reportConversionEvent.fields),
        event_name: 'add_to_cart'
      },
      type: 'automatic'
    },
    {
      name: 'Checkout',
      subscribe: 'type = "track" AND event = "Checkout"',
      partnerAction: 'reportConversionEvent',
      mapping: {
        ...defaultValues(reportConversionEvent.fields),
        event_name: 'checkout'
      },
      type: 'automatic'
    },
    {
      name: 'Lead',
      subscribe: 'type = "track" AND event = "Generate Lead"',
      partnerAction: 'reportConversionEvent',
      mapping: {
        ...defaultValues(reportConversionEvent.fields),
        event_name: 'lead'
      },
      type: 'automatic'
    },
    {
      name: 'Page Visit',
      subscribe: 'type = "page"',
      partnerAction: 'reportConversionEvent',
      mapping: {
        ...defaultValues(reportConversionEvent.fields),
        event_name: 'page_visit'
      },
      type: 'automatic'
    },
    {
      name: 'Search',
      subscribe: 'type = "track" AND event = "Products Searched"',
      partnerAction: 'reportConversionEvent',
      mapping: {
        ...defaultValues(reportConversionEvent.fields),
        event_name: 'search'
      },
      type: 'automatic'
    },
    {
      name: 'Sign Up',
      subscribe: 'type = "track" AND event = "Signed Up"',
      partnerAction: 'reportConversionEvent',
      mapping: {
        ...defaultValues(reportConversionEvent.fields),
        event_name: 'signup'
      },
      type: 'automatic'
    },
    {
      name: 'View Category',
      subscribe: 'type = "track" AND event = "Product Category Viewed"',
      partnerAction: 'reportConversionEvent',
      mapping: {
        ...defaultValues(reportConversionEvent.fields),
        event_name: 'view_category'
      },
      type: 'automatic'
    },
    {
      name: 'Watch Video',
      subscribe: 'type = "track" AND event = "Product Video Watched"',
      partnerAction: 'reportConversionEvent',
      mapping: {
        ...defaultValues(reportConversionEvent.fields),
        event_name: 'watch_video'
      },
      type: 'automatic'
    }
  ],
  actions: {
    reportConversionEvent
  }
}

export default destination

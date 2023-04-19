import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import { API_VERSION } from './constants'
import type { Settings } from './generated-types'
import reportConversionEvent from './reportConversionEvent'

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
          'Unique identifier of an ad account. This can be found in the Pinterest UI by following the steps mentioned [here](https://developers.pinterest.com/docs/conversions/conversion-management/#Finding%20your%20%2Cad_account_id).',
        type: 'string',
        required: true
      },
      conversion_token: {
        label: 'Conversion Token',
        description:
          'The conversion token for your Pinterest account. This can be found in the Pinterest UI by following the steps mentioned [here](https://developers.pinterest.com/docs/conversions/conversion-management/#Authenticating%20for%20the%20send%20conversion%20events%20endpoint).',
        type: 'password',
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      // Return a request that tests/validates the user's credentials.
      return request(
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
      }
    },
    {
      name: 'Checkout',
      subscribe: 'type = "track" AND event = "Checkout"',
      partnerAction: 'reportConversionEvent',
      mapping: {
        ...defaultValues(reportConversionEvent.fields),
        event_name: 'checkout'
      }
    },
    {
      name: 'Lead',
      subscribe: 'type = "track" AND event = "Generate Lead"',
      partnerAction: 'reportConversionEvent',
      mapping: {
        ...defaultValues(reportConversionEvent.fields),
        event_name: 'lead'
      }
    },
    {
      name: 'Page Visit',
      subscribe: 'type = "page"',
      partnerAction: 'reportConversionEvent',
      mapping: {
        ...defaultValues(reportConversionEvent.fields),
        event_name: 'page_visit'
      }
    },
    {
      name: 'Search',
      subscribe: 'type = "track" AND event = "Products Searched"',
      partnerAction: 'reportConversionEvent',
      mapping: {
        ...defaultValues(reportConversionEvent.fields),
        event_name: 'search'
      }
    },
    {
      name: 'Sign Up',
      subscribe: 'type = "track" AND event = "Signed Up"',
      partnerAction: 'reportConversionEvent',
      mapping: {
        ...defaultValues(reportConversionEvent.fields),
        event_name: 'signup'
      }
    },
    {
      name: 'View Category',
      subscribe: 'type = "track" AND event = "Product Category Viewed"',
      partnerAction: 'reportConversionEvent',
      mapping: {
        ...defaultValues(reportConversionEvent.fields),
        event_name: 'view_category'
      }
    },
    {
      name: 'Watch Video',
      subscribe: 'type = "track" AND event = "Product Video Watched"',
      partnerAction: 'reportConversionEvent',
      mapping: {
        ...defaultValues(reportConversionEvent.fields),
        event_name: 'watch_video'
      }
    }
  ],
  actions: {
    reportConversionEvent
  }
}

export default destination

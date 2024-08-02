import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import type { RedditConversionsTestAuthenticationError } from './types'
import reportConversionEvent from './reportConversionEvent'

const destination: DestinationDefinition<Settings> = {
  name: 'Reddit Conversions Api',
  slug: 'actions-reddit-conversions-api',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      ad_account_id: {
        label: 'Ad Account ID',
        description:
          'Unique identifier of an ad account. This can be found in the Reddit UI.',
        type: 'string',
        required: true
      },
      conversion_token: {
        label: 'Conversion Token',
        description:
          'The conversion token for your Reddit account. This can be found by following the steps mentioned [here](https://business.reddithelp.com/helpcenter/s/article/conversion-access-token).',
        type: 'string',
        required: true
      }
    },
    testAuthentication: async (request, { settings }) => {
      try {
        return await request(
          `https://ads-api.reddit.com/api/v2.0/conversions/events/${settings.ad_account_id}`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${settings.conversion_token}`
            },
            json: {
              test_mode: true,
              events: [
                {
                  event_at: new Date().toISOString(),
                  user: {
                    email: 'test@example.com',
                    external_id: 'identity-test',
                    ip_address: '127.0.0.1',
                    user_agent: 'Mozilla/5.0'
                  },
                  event_type: {
                    tracking_type: 'PageVisit'
                  },
                  event_metadata: {
                    currency: 'USD',
                    value_decimal: 1
                  }
                }
              ]
            }
          }
        )
      } catch (err) {
        const error = err as RedditConversionsTestAuthenticationError
        if (error.response && error.response.status === 401) {
          throw new Error('Unauthorized: Invalid Conversion Token, please verify you have entered the correct Conversion Token.')
        } else if (error.response && error.response.status === 403) {
          throw new Error('Forbidden: Invalid Ad Account ID, please verify you have entered the correct Ad Account ID.')
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
      name: 'Page Visit',
      subscribe: 'type = "page"',
      partnerAction: 'reportConversionEvent',
      mapping: {
        ...defaultValues(reportConversionEvent.fields),
        event_type: { tracking_type: 'PageVisit' }
      },
      type: 'automatic'
    },
    {
      name: 'View Content',
      subscribe: 'type = "track" AND event = "Product Viewed"',
      partnerAction: 'reportConversionEvent',
      mapping: {
        ...defaultValues(reportConversionEvent.fields),
        event_type: { tracking_type: 'ViewContent' }
      },
      type: 'automatic'
    },
    {
      name: 'Search',
      subscribe: 'type = "track" AND event = "Products Searched"',
      partnerAction: 'reportConversionEvent',
      mapping: {
        ...defaultValues(reportConversionEvent.fields),
        event_type: { tracking_type: 'Search' }
      },
      type: 'automatic'
    },
    {
      name: 'Add to Cart',
      subscribe: 'type = "track" AND event = "Product Added"',
      partnerAction: 'reportConversionEvent',
      mapping: {
        ...defaultValues(reportConversionEvent.fields),
        event_type: { tracking_type: 'AddToCart' }
      },
      type: 'automatic'
    },
    {
      name: 'Add to Wishlist',
      subscribe: 'type = "track" AND event = "Product Added to Wishlist"',
      partnerAction: 'reportConversionEvent',
      mapping: {
        ...defaultValues(reportConversionEvent.fields),
        event_type: { tracking_type: 'AddToWishlist' }
      },
      type: 'automatic'
    },
    {
      name: 'Purchase',
      subscribe: 'type = "track" AND event = "Order Completed"',
      partnerAction: 'reportConversionEvent',
      mapping: {
        ...defaultValues(reportConversionEvent.fields),
        event_type: { tracking_type: 'Purchase' }
      },
      type: 'automatic'
    },
    {
      name: 'Lead',
      subscribe: 'type = "track" AND event = "Generate Lead"',
      partnerAction: 'reportConversionEvent',
      mapping: {
        ...defaultValues(reportConversionEvent.fields),
        event_type: { tracking_type: 'Lead' }
      },
      type: 'automatic'
    },
    {
      name: 'Sign Up',
      subscribe: 'type = "track" AND event = "Signed Up"',
      partnerAction: 'reportConversionEvent',
      mapping: {
        ...defaultValues(reportConversionEvent.fields),
        event_type: { tracking_type: 'SignUp' }
      },
      type: 'automatic'
    }
  ],

  actions: {
    reportConversionEvent
  }
}

export default destination

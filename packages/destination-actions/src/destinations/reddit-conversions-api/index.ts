import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import type { RedditConversionsTestAuthenticationError } from './types'
import standardEvent from './standardEvent'
import customEvent from './customEvent'

const destination: DestinationDefinition<Settings> = {
  name: 'Reddit Conversions API',
  slug: 'actions-reddit-conversions-api',
  mode: 'cloud',
  description: 'Send Segment events to Reddit Conversions API.',
  authentication: {
    scheme: 'custom',
    fields: {
      ad_account_id: {
        label: 'Pixel ID',
        description: 'Unique identifier of an ad account. This can be found in the Reddit UI.',
        type: 'string',
        required: true
      },
      conversion_token: {
        label: 'Conversion Token',
        description:
          'The conversion token for your Reddit account. This can be found by following the steps mentioned [here](https://business.reddithelp.com/helpcenter/s/article/conversion-access-token).',
        type: 'string',
        required: true
      },
      test_mode: {
        label: 'Test Mode',
        description: 'Indicates if events should be treated as test events by Reddit.',
        type: 'boolean',
        required: false,
        default: false
      }
    },
    testAuthentication: async (request, { settings }) => {
      try {
        return await request(`https://ads-api.reddit.com/api/v2.0/conversions/events/${settings.ad_account_id}`, {
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
        })
      } catch (err) {
        const error = err as RedditConversionsTestAuthenticationError
        if (error.response && error.response.status === 401) {
          throw new Error(
            'Unauthorized: Invalid Conversion Token, please verify you have entered the correct Conversion Token.'
          )
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
      name: 'Reddit Browser Plugin',
      subscribe: 'type = "track" or type = "identify" or type = "group" or type = "page" or type = "alias"',
      partnerAction: 'redditPlugin',
      mapping: {},
      type: 'automatic'
    },
    {
      name: 'Page Visit',
      subscribe: 'type = "page"',
      partnerAction: 'standardEvent',
      mapping: {
        ...defaultValues(standardEvent.fields),
        tracking_type: 'PageVisit',
        event_metadata: {}
      },
      type: 'automatic'
    },
    {
      name: 'View Content',
      subscribe: 'type = "track" and event = "Product Viewed"',
      partnerAction: 'standardEvent',
      mapping: {
        ...defaultValues(standardEvent.fields),
        tracking_type: 'ViewContent',
        event_metadata: {}
      },
      type: 'automatic'
    },
    {
      name: 'Search',
      subscribe: 'type = "track" and event = "Products Searched"',
      partnerAction: 'standardEvent',
      mapping: {
        ...defaultValues(standardEvent.fields),
        tracking_type: 'Search',
        event_metadata: {}
      },
      type: 'automatic'
    },
    {
      name: 'Add to Cart',
      subscribe: 'type = "track" and event = "Product Added"',
      partnerAction: 'standardEvent',
      mapping: {
        ...defaultValues(standardEvent.fields),
        tracking_type: 'AddToCart',
        event_metadata: {
          currency: { '@path': '$.properties.currency' },
          itemCount: { '@path': '$.properties.quantity' },
          value: { '@path': '$.properties.price' }
        }
      },
      type: 'automatic'
    },
    {
      name: 'Add to Wishlist',
      subscribe: 'type = "track" and event = "Product Added to Wishlist"',
      partnerAction: 'standardEvent',
      mapping: {
        ...defaultValues(standardEvent.fields),
        tracking_type: 'AddToWishlist',
        event_metadata: {
          currency: { '@path': '$.properties.currency' },
          itemCount: { '@path': '$.properties.quantity' },
          value: { '@path': '$.properties.price' }
        }
      },
      type: 'automatic'
    },
    {
      name: 'Purchase',
      subscribe: 'type = "track" and event = "Order Completed"',
      partnerAction: 'standardEvent',
      mapping: {
        ...defaultValues(standardEvent.fields),
        tracking_type: 'Purchase'
      },
      type: 'automatic'
    },
    {
      name: 'Lead',
      subscribe: 'type = "track" and event = "Lead Generated"',
      partnerAction: 'standardEvent',
      mapping: {
        ...defaultValues(standardEvent.fields),
        tracking_type: 'Lead',
        event_metadata: {
          currency: { '@path': '$.properties.currency' },
          value_decimal: { '@path': '$.properties.price' }
        }
      },
      type: 'automatic'
    },
    {
      name: 'Sign Up',
      subscribe: 'type = "track" and event = "Signed Up"',
      partnerAction: 'standardEvent',
      mapping: {
        ...defaultValues(standardEvent.fields),
        tracking_type: 'SignUp',
        event_metadata: {
          currency: { '@path': '$.properties.currency' },
          value_decimal: { '@path': '$.properties.price' }
        }
      },
      type: 'automatic'
    }
  ],

  actions: {
    standardEvent,
    customEvent
  }
}

export default destination

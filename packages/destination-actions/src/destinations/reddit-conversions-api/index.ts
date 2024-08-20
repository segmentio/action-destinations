import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import type { RedditConversionsTestAuthenticationError } from './types'
import custom from './custom'
import pageVisit from './pageVisit'

import viewContent from './viewContent'

import search from './search'

import addToCart from './addToCart'

import addToWishlist from './addToWishlist'

import purchase from './purchase'

import lead from './lead'

import signUp from './signUp'

import standardEvent from './standardEvent'

const destination: DestinationDefinition<Settings> = {
  name: 'Reddit Conversions Api',
  slug: 'actions-reddit-conversions-api',
  mode: 'cloud',
  description: 'Send Segment events to Reddit Conversions API.',
  authentication: {
    scheme: 'custom',
    fields: {
      ad_account_id: {
        label: 'Ad Account ID',
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
      name: 'Custom',
      subscribe: 'type = "page"',
      partnerAction: 'custom',
      mapping: {
        ...defaultValues(custom.fields),
        event_type: { tracking_type: 'Custom' }
      },
      type: 'automatic'
    },
    {
      name: 'Page Visit',
      subscribe: 'type = "page"',
      partnerAction: 'pageVisit',
      mapping: {
        ...defaultValues(pageVisit.fields),
        event_type: { tracking_type: 'PageVisit' }
      },
      type: 'automatic'
    },
    {
      name: 'View Content',
      subscribe: 'type = "track" AND event = "Product Category Viewed"',
      partnerAction: 'viewContent',
      mapping: {
        ...defaultValues(viewContent.fields),
        event_type: { tracking_type: 'ViewContent' }
      },
      type: 'automatic'
    },
    {
      name: 'Search',
      subscribe: 'type = "track" AND event = "Products Searched"',
      partnerAction: 'search',
      mapping: {
        ...defaultValues(search.fields),
        event_type: { tracking_type: 'Search' }
      },
      type: 'automatic'
    },
    {
      name: 'Add to Cart',
      subscribe: 'type = "track" AND event = "Product Added"',
      partnerAction: 'addToCart',
      mapping: {
        ...defaultValues(addToCart.fields),
        event_type: { tracking_type: 'AddToCart' }
      },
      type: 'automatic'
    },
    {
      name: 'Add to Wishlist',
      subscribe: 'type = "track" AND event = "Products Searched"', //check for this
      partnerAction: 'addToWishlist',
      mapping: {
        ...defaultValues(addToWishlist.fields),
        event_type: { tracking_type: 'AddToWishlist' }
      },
      type: 'automatic'
    },
    {
      name: 'Purchase',
      subscribe: 'type = "track" AND event = "Checkout"',
      partnerAction: 'purchase',
      mapping: {
        ...defaultValues(purchase.fields),
        event_type: { tracking_type: 'Purchase' }
      },
      type: 'automatic'
    },
    {
      name: 'Lead',
      subscribe: 'type = "track" AND event = "Generate Lead"',
      partnerAction: 'lead',
      mapping: {
        ...defaultValues(lead.fields),
        event_type: { tracking_type: 'Lead' }
      },
      type: 'automatic'
    },
    {
      name: 'Sign Up',
      subscribe: 'type = "track" AND event = "Signed Up"',
      partnerAction: 'signUp',
      mapping: {
        ...defaultValues(signUp.fields),
        event_type: { tracking_type: 'SignUp' }
      },
      type: 'automatic'
    }
  ],

  actions: {
    custom,
    pageVisit,
    viewContent,
    search,
    addToCart,
    addToWishlist,
    purchase,
    lead,
    signUp,
    standardEvent
  }
}

export default destination

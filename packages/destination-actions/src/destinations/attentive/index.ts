import { DestinationDefinition, defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'
import customEvents from './customEvents'
import ecommEvent from './ecommEvent'
import upsertUserAttributes from './upsertUserAttributes'
import subscribeUser from './subscribeUser'


const destination: DestinationDefinition<Settings> = {
  name: 'Attentive',
  slug: 'actions-attentive',
  mode: 'cloud',
  description: 'Send Segment analytics events to Attentive.',
  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Your Attentive API Key.',
        type: 'string',
        required: true
      }
    },
    testAuthentication: async (request, { settings }) => {
      return request('https://api.attentivemobile.com/v1/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${settings.apiKey}`
        }
      })
    }
  },

  extendRequest({ settings }) {
    return {
      headers: {
        Authorization: `Bearer ${settings.apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  },
  presets: [
    {
      name: 'Subscribe User',
      subscribe: 'type = "track" and event = "User Subscribed"',
      partnerAction: 'subscribeUser',
      mapping: defaultValues(subscribeUser.fields),
      type: 'automatic'
    },
    {
      name: 'Upsert User Attributes',
      subscribe: 'type = "identify"',
      partnerAction: 'upsertUserAttributes',
      mapping: defaultValues(upsertUserAttributes.fields),
      type: 'automatic'
    },
    {
      name: 'View Item',
      subscribe: 'event = "Product Viewed"',
      partnerAction: 'ecommEvent',
      mapping: { 
        ...defaultValues(ecommEvent.fields),
        eventType: 'view_item', 
      },
      type: 'automatic'
    },
    {
      name: 'Add to Cart',
      subscribe: 'event = "Product Added"',
      partnerAction: 'ecommEvent',
      mapping: { 
        ...defaultValues(ecommEvent.fields),
        eventType: 'add_to_cart', 
      },
      type: 'automatic'
    },
    {
      name: 'Purchase',
      subscribe: 'event = "Order Completed"',
      partnerAction: 'ecommEvent',
      mapping: { 
        ...defaultValues(ecommEvent.fields),
        eventType: 'purchase', 
      },
      type: 'automatic'
    }
  ],
  actions: {
    customEvents,
    ecommEvent,
    upsertUserAttributes,
    subscribeUser
  }
}

export default destination

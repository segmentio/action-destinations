import { defaultValues } from '@segment/actions-core'
import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import singleProductEvent from './singleProductEvent'
import multiProductEvent from './multiProductEvent'
import upsertContact from './upsertContact'
import emailEvent from './emailEvent'

import { hosts } from './utils'

const destination: DestinationDefinition<Settings> = {
  name: 'Optimizely Data Platform',
  slug: 'actions-optimizely-data-platform',
  mode: 'cloud',
  description: 'Sync Segment analytics events and user profile data to Optimizely Data Platform',
  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'Api Key',
        description: 'Api Key used for Optimizely API authorization when sending events',
        type: 'password',
        required: true
      },
      region: {
        label: 'Region',
        description: 'Optimizely Region to sync data to. Default is US',
        type: 'string',
        required: true,
        choices: [
          { label: 'US', value: 'US' },
          { label: 'Europe', value: 'EU' },
          { label: 'Australia', value: 'AU' }
        ],
        default: 'US'
      }
    },
    testAuthentication: (request, { settings }) => {
      const host = hosts[settings.region]

      return request(`${host}/auth`, {
        method: 'POST'
      })
    }
  },
  extendRequest({ settings }) {
    return {
      headers: { Authorization: `Bearer ${settings.apiKey}` }
    }
  },
  presets: [
    {
      name: 'Product Viewed',
      subscribe: 'type = "track" and event = "Product Viewed"',
      partnerAction: 'singleProductEvent',
      mapping: {
        ...defaultValues(singleProductEvent.fields),
        event_action: 'detail'
      },
      type: 'automatic'
    },
    {
      name: 'Product Added',
      subscribe: 'type = "track" and event = "Product Added"',
      partnerAction: 'singleProductEvent',
      mapping: {
        ...defaultValues(singleProductEvent.fields),
        event_action: 'add_to_cart'
      },
      type: 'automatic'
    },
    {
      name: 'Product Removed',
      subscribe: 'type = "track" and event = "Product Removed"',
      partnerAction: 'singleProductEvent',
      mapping: {
        ...defaultValues(singleProductEvent.fields),
        event_action: 'remove_from_cart'
      },
      type: 'automatic'
    },
    {
      name: 'Order Completed',
      subscribe: 'type = "track" and event = "Order Completed"',
      partnerAction: 'multiProductEvent',
      mapping: {
        ...defaultValues(multiProductEvent.fields),
        event_action: 'purchase'
      },
      type: 'automatic'
    }
  ],
  actions: {
    singleProductEvent,
    upsertContact,
    multiProductEvent,
    emailEvent
  }
}

export default destination

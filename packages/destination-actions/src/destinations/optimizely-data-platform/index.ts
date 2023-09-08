import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { hosts } from './utils'

import singleProductEvent from './singleProductEvent'

import upsertContact from './upsertContact'

import multiProductEvent from './multiProductEvent'
import { defaultValues } from '@segment/actions-core'

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
  presets:[
    {
      name: 'Product Viewed',
      subscribe: 'type = "track" and event = "Product Viewed"',
      partnerAction: 'singleProductEvent',
      mapping: { 
        ...defaultValues(singleProductEvent.fields),
        event_action: 'product_viewed'
      },
      type: 'automatic'
    },
    {
      name: 'Product Added',
      subscribe: 'type = "track" and event = "Product Added"',
      partnerAction: 'singleProductEvent',
      mapping: { 
        ...defaultValues(singleProductEvent.fields),
        event_action: 'product_added'
      },
      type: 'automatic'
    },
    {
      name: 'Product Removed',
      subscribe: 'type = "track" and event = "Product Removed"',
      partnerAction: 'singleProductEvent',
      mapping: { 
        ...defaultValues(singleProductEvent.fields),
        event_action: 'product_removed' 
      },
      type: 'automatic'
    }
  ],
  actions: {
    singleProductEvent,
    upsertContact,
    multiProductEvent
  }
}

export default destination

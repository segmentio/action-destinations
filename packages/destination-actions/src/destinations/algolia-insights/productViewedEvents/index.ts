import type { ActionDefinition, Preset } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import { AlgoliaBehaviourURL, AlgoliaProductViewedEvent } from '../algolia-insight-api'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

export const productViewedEvents: ActionDefinition<Settings, Payload> = {
  title: 'Product Viewed Events',
  description: 'Product views which can be tied back to an Algolia Search, Recommend or Predict result',
  fields: {
    objectID: {
      label: 'Product ID',
      description: 'Product ID of the clicked item.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.properties.product_id'
      }
    },
    index: {
      label: 'Index',
      description: 'Name of the targeted search index.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.properties.search_index'
      }
    },
    queryID: {
      label: 'Query ID',
      description: 'Query ID of the list on which the item was viewed.',
      type: 'string',
      required: false,
      default: {
        '@path': '$.properties.query_id'
      }
    },
    userToken: {
      type: 'string',
      required: true,
      description: 'The ID associated with the user.',
      label: 'userToken',
      default: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.anonymousId' }
        }
      }
    },
    timestamp: {
      type: 'string',
      required: false,
      description: 'The timestamp of the event.',
      label: 'timestamp',
      default: { '@path': '$.timestamp' }
    }
  },
  defaultSubscription: 'type = "track" and event = "Product Viewed"',
  perform: (request, data) => {
    const insightEvent: AlgoliaProductViewedEvent = {
      ...data.payload,
      eventName: 'Product Viewed',
      eventType: 'view',
      objectIDs: [data.payload.objectID],
      timestamp: data.payload.timestamp ? new Date(data.payload.timestamp).valueOf() : undefined,
      userToken: data.payload.userToken
    }
    const insightPayload = { events: [insightEvent] }

    return request(AlgoliaBehaviourURL, {
      method: 'post',
      json: insightPayload
    })
  }
}

/** used in the quick setup */
export const productViewedPresets: Preset = {
  name: 'Send product viewed events to Algolia',
  subscribe: productViewedEvents.defaultSubscription as string,
  partnerAction: 'productViewedEvents',
  mapping: defaultValues(productViewedEvents.fields),
  type: 'automatic'
}

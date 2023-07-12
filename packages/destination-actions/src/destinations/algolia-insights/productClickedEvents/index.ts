import type { ActionDefinition } from '@segment/actions-core'
import { Subscription, defaultValues } from '@segment/actions-core'
import { AlgoliaBehaviourURL, AlgoliaProductClickedEvent } from '../algolia-insight-api'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

export const productClickedEvents: ActionDefinition<Settings, Payload> = {
  title: 'Product Clicked Events',
  description: 'When a product is clicked within an Algolia Search, Recommend or Predict result',
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
      description: 'Query ID of the list on which the item was clicked.',
      type: 'string',
      required: false,
      default: {
        '@path': '$.properties.query_id'
      }
    },
    position: {
      label: 'Position',
      description: 'Position of the click in the list of Algolia search results.',
      type: 'integer',
      required: false,
      default: {
        '@path': '$.properties.position'
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
  defaultSubscription: 'type = "track" and event = "Product Clicked"',
  perform: (request, data) => {
    const insightEvent: AlgoliaProductClickedEvent = {
      ...data.payload,
      eventName: 'Product Clicked',
      eventType: 'click',
      objectIDs: [data.payload.objectID],
      userToken: data.payload.userToken,
      positions: data.payload.position ? [data.payload.position] : undefined,
      timestamp: data.payload.timestamp ? new Date(data.payload.timestamp).valueOf() : undefined
    }
    const insightPayload = { events: [insightEvent] }

    return request(AlgoliaBehaviourURL, {
      method: 'post',
      json: insightPayload
    })
  }
}

/** used in the quick setup */
export const productClickPresets: Subscription = {
  name: 'Send product clicked events to Algolia',
  subscribe: productClickedEvents.defaultSubscription as string,
  partnerAction: 'productClickedEvents',
  mapping: defaultValues(productClickedEvents.fields)
}

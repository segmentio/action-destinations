import type { ActionDefinition } from '@segment/actions-core'
import { Subscription, defaultValues } from '@segment/actions-core'
import { AlgoliaBehaviourURL, AlgoliaProductClickedEvent } from '../algolia-insight-api'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

/** used in the quick setup */
export const productClickPresets: Subscription[] = [
  // and is $ meant to represent something specific?
  {
    name: 'Product ID',
    subscribe: 'type = "track" and event = "Product Clicked"',
    partnerAction: 'properties',
    mapping: defaultValues({ '@path': '$.properties.product_id' })
  },
  {
    name: 'Index',
    subscribe: 'type = "track" and event = "Product Clicked"',
    partnerAction: 'properties',
    mapping: defaultValues({ '@path': '$.properties.search_index' })
  },
  {
    name: 'Query ID',
    subscribe: 'type = "track" and event = "Product Clicked"',
    partnerAction: 'properties',
    mapping: defaultValues({ '@path': '$.properties.query_id' })
  },
  {
    name: 'Position',
    subscribe: 'type = "track" and event = "Product Clicked"',
    partnerAction: 'properties',
    mapping: defaultValues({ '@path': '$.properties.position' })
  },
  {
    name: 'Anonymous ID',
    subscribe: 'type = "track" and event = "Product Clicked"',
    partnerAction: 'anonymousId',
    mapping: defaultValues({ '@path': '$.anonymousId' })
  },
  {
    name: 'User ID',
    subscribe: 'type = "track" and event = "Product Clicked"',
    partnerAction: 'userId',
    mapping: defaultValues({ '@path': '$.userId' })
  },
  {
    name: 'timestamp',
    subscribe: 'type = "track" and event = "Product Clicked"',
    partnerAction: 'timestamp',
    mapping: defaultValues({ '@path': '$.timestamp' })
  }
]

const action: ActionDefinition<Settings, Payload> = {
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
      required: true,
      default: {
        '@path': '$.properties.query_id'
      }
    },
    position: {
      label: 'Position',
      description: 'Position of the click in the list of Algolia search results.',
      type: 'integer',
      required: true,
      default: {
        '@path': '$.properties.position'
      }
    },
    anonymousID: {
      label: 'Anonymous ID',
      description: "The user's anonymous id.",
      type: 'string',
      required: false,
      default: { '@path': '$.anonymousId' }
    },
    userID: {
      type: 'string',
      required: false,
      description: 'The ID associated with the user',
      label: 'User ID',
      default: { '@path': '$.userId' }
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
      userToken: data.payload.userID || data.payload.anonymousID,
      positions: [data.payload.position],
      timestamp: data.payload.timestamp ? new Date(data.payload.timestamp).valueOf() : undefined
    }
    const insightPayload = { events: [insightEvent] }

    return request(AlgoliaBehaviourURL, {
      method: 'post',
      json: insightPayload
    })
  }
}

export default action

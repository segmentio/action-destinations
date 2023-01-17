import type { ActionDefinition } from '@segment/actions-core'
import { ProductClickedEvent } from '../algolia-insight-api'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Product Clicked Events',
  description: '',
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
      required: true,
      default: { '@path': '$.anonymousId' }
    },
    userID: {
      type: 'string',
      required: false,
      description: 'The ID associated with the user',
      label: 'User ID',
      default: { '@path': '$.userId' }
    }
  },
  defaultSubscription: 'type = "track" and event = "Product Clicked"',
  perform: (request, data) => {
    const insightEvent: ProductClickedEvent = {
      ...data.payload,
      eventName: 'Product Clicked',
      eventType: 'click',
      objectIDs: [data.payload.objectID],
      userToken: data.payload.userID || data.payload.anonymousID,
      positions: [data.payload.position]
    }
    const insightPayload = { events: [insightEvent] }

    return request('https://insights.algolia.io/1/events', {
      method: 'post',
      json: insightPayload
    })
  }
}

export default action

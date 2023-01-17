import type { ActionDefinition } from '@segment/actions-core'
import { AlgoliaBehaviourURL, AlgoliaProductViewedEvent } from '../algolia-insight-api'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
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
      description: 'Query ID of the list on which the item was clicked.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.properties.query_id'
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
  defaultSubscription: 'type = "track" and event = "Product Viewed"',
  perform: (request, data) => {
    const insightEvent: AlgoliaProductViewedEvent = {
      ...data.payload,
      eventName: 'Product Viewed',
      eventType: 'view',
      objectIDs: [data.payload.objectID],
      userToken: data.payload.userID || data.payload.anonymousID
    }
    const insightPayload = { events: [insightEvent] }

    return request(AlgoliaBehaviourURL, {
      method: 'post',
      json: insightPayload
    })
  }
}

export default action

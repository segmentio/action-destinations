import type { ActionDefinition } from '@segment/actions-core'
import { Subscription, defaultValues } from '@segment/actions-core'
import { AlgoliaBehaviourURL, AlgoliaConversionEvent } from '../algolia-insight-api'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

export const conversionPresets: Subscription[] = [
  // and is $ meant to represent something specific?
  {
    name: 'Products',
    subscribe: 'type = "track" and event = "Order Completed"',
    partnerAction: 'properties',
    mapping: defaultValues({ '@path': '$.properties.products' })
  },
  {
    name: 'Index',
    subscribe: 'type = "track" and event = "Order Completed"',
    partnerAction: 'properties',
    mapping: defaultValues({ '@path': '$.properties.search_index' })
  },
  {
    name: 'Query ID',
    subscribe: 'type = "track" and event = "Order Completed"',
    partnerAction: 'properties',
    mapping: defaultValues({ '@path': '$.properties.query_id' })
  },
  {
    name: 'Anonymous ID',
    subscribe: 'type = "track" and event = "Order Completed"',
    partnerAction: 'anonymousId',
    mapping: defaultValues({ '@path': '$.anonymousId' })
  },
  {
    name: 'User ID',
    subscribe: 'type = "track" and event = "Order Completed"',
    partnerAction: 'userId',
    mapping: defaultValues({ '@path': '$.userId' })
  },
  {
    name: 'timestamp',
    subscribe: 'type = "track" and event = "Order Completed"',
    partnerAction: 'timestamp',
    mapping: defaultValues({ '@path': '$.timestamp' })
  }
]

const action: ActionDefinition<Settings, Payload> = {
  title: 'Conversion Events',
  description: 'Successful product purcahses which can be tied back to an Algolia Search, Recommend or Predict result',
  fields: {
    products: {
      label: 'Product Details',
      description:
        'An array of objects representing the purchased items. Each object must contains a product_id field.',
      type: 'object',
      multiple: true,
      properties: { product_id: { label: 'product_id', type: 'string', required: true } },
      required: true,
      default: {
        '@path': '$.properties.products'
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
      description: 'The ID associated with the user.',
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
  defaultSubscription: 'type = "track" and event = "Order Completed"',
  perform: (request, data) => {
    const insightEvent: AlgoliaConversionEvent = {
      ...data.payload,
      eventName: 'Conversion Event',
      eventType: 'conversion',
      objectIDs: data.payload.products.map((product) => product.product_id),
      userToken: data.payload.userID || data.payload.anonymousID,
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

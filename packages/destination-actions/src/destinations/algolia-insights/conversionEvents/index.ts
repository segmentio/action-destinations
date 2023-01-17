import type { ActionDefinition } from '@segment/actions-core'
import { ConversionEvent } from '../algolia-insight-api'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Conversion Events',
  description: '',
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
      description: 'The ID associated with the user',
      label: 'User ID',
      default: { '@path': '$.userId' }
    }
  },
  defaultSubscription: 'type = "track" and event = "Order Completed"',
  perform: (request, data) => {
    const insightEvent: ConversionEvent = {
      ...data.payload,
      eventName: 'Conversion Event',
      eventType: 'conversion',
      objectIDs: data.payload.products.map((product) => product.product_id),
      userToken: data.payload.userID || data.payload.anonymousID
    }
    const insightPayload = { events: [insightEvent] }

    return request('https://insights.algolia.io/1/events', {
      method: 'post',
      json: { insightPayload, eventName: 'Conversion Event', eventType: 'conversion' }
    })
  }
}

export default action

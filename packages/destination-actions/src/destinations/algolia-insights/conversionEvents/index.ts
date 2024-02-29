import type { ActionDefinition, Preset } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import {
  AlgoliaBehaviourURL,
  AlgoliaConversionEvent,
  AlgoliaEventSubtype,
  AlgoliaEventType
} from '../algolia-insight-api'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const notUndef = (thing: unknown) => typeof thing !== 'undefined'

export const conversionEvents: ActionDefinition<Settings, Payload> = {
  title: 'Conversion Events',
  description:
    'In ecommerce, conversions are purchase events often but not always involving multiple products. Outside of a conversion can be any positive signal associated with an index record. Query ID is optional and indicates that the view events is the result of a search query.',
  fields: {
    eventSubtype: {
      label: 'Event Subtype',
      description: 'Sub-type of the event, "purchase" or "addToCart".',
      type: 'string',
      required: false,
      choices: [
        { value: 'purchase', label: 'Purchase' },
        { value: 'addToCart', label: 'Add To Cart' }
      ],
      default: 'purchase'
    },
    products: {
      label: 'Product Details',
      description:
        'Populates the ObjectIDs field in the Algolia Insights API. An array of objects representing the purchased items. Each object must contain a product_id field.',
      type: 'object',
      multiple: true,
      defaultObjectUI: 'keyvalue',
      properties: {
        product_id: { label: 'product_id', type: 'string', required: true },
        price: { label: 'price', type: 'number', required: false },
        quantity: { label: 'quantity', type: 'number', required: false },
        discount: { label: 'discount', type: 'number', required: false },
        queryID: { label: 'queryID', type: 'string', required: false }
      },
      required: true,
      default: {
        '@arrayPath': [
          '$.properties.products',
          {
            product_id: {
              '@path': '$.product_id'
            },
            price: {
              '@path': '$.price'
            },
            quantity: {
              '@path': '$.quantity'
            },
            discount: {
              '@path': '$.discount'
            },
            queryID: {
              '@path': '$.queryID'
            }
          }
        ]
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
      description: 'Query ID of the list on which the item was purchased.',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.properties.query_id' },
          then: { '@path': '$.properties.query_id' },
          else: { '@path': '$.integrations.Algolia Insights (Actions).query_id' }
        }
      }
    },
    userToken: {
      type: 'string',
      required: true,
      description: 'The ID associated with the user.',
      label: 'User Token',
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
      label: 'Timestamp',
      default: { '@path': '$.timestamp' }
    },
    value: {
      type: 'number',
      required: false,
      description: 'The value of the cart that is being converted.',
      label: 'Value',
      default: { '@path': '$.properties.value' }
    },
    currency: {
      type: 'string',
      required: false,
      description:
        'Currency of the objects associated with the event in 3-letter ISO 4217 format. Required when `value` or `price` is set.',
      label: 'Currency',
      default: { '@path': '$.properties.currency' }
    },
    extraProperties: {
      label: 'Extra Properties',
      required: false,
      description:
        'Additional fields for this event. This field may be useful for Algolia Insights fields which are not mapped in Segment.',
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    },
    eventName: {
      label: 'Event Name',
      description: "The name of the event to send to Algolia. Defaults to 'Conversion Event'",
      type: 'string',
      required: false,
      default: 'Conversion Event'
    },
    eventType: {
      label: 'Event Type',
      description: "The type of event to send to Algolia. Defaults to 'conversion'",
      type: 'string',
      required: false,
      default: 'conversion',
      choices: [
        { label: 'View', value: 'view' },
        { label: 'Conversion', value: 'conversion' },
        { label: 'Click', value: 'click' }
      ]
    }
  },
  defaultSubscription: 'type = "track" and event = "Order Completed"',
  perform: (request, data) => {
    const objectData = data.payload.products.some(({ queryID, price, discount, quantity }) => {
      return notUndef(queryID) || notUndef(price) || notUndef(discount) || notUndef(quantity)
    })
      ? data.payload.products.map(({ queryID, price, discount, quantity }) => ({
          queryID,
          price,
          discount,
          quantity
        }))
      : undefined
    const insightEvent: AlgoliaConversionEvent = {
      ...data.payload.extraProperties,
      eventName: data.payload.eventName ?? 'Conversion Event',
      eventType: (data.payload.eventType as AlgoliaEventType) ?? ('conversion' as AlgoliaEventType),
      eventSubtype: (data.payload.eventSubtype as AlgoliaEventSubtype) ?? 'purchase',
      index: data.payload.index,
      queryID: data.payload.queryID,
      objectIDs: data.payload.products.map((product) => product.product_id),
      objectData,
      value: data.payload.value,
      currency: data.payload.currency,
      userToken: data.payload.userToken,
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
export const conversionPresets: Preset = {
  name: 'Send conversion events to Algolia',
  subscribe: conversionEvents.defaultSubscription as string,
  partnerAction: 'conversionEvents',
  mapping: defaultValues(conversionEvents.fields),
  type: 'automatic'
}

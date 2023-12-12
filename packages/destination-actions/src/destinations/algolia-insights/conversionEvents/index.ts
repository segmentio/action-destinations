import type { ActionDefinition, Preset } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import { AlgoliaBehaviourURL, AlgoliaConversionEvent, AlgoliaEventType } from '../algolia-insight-api'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

export const conversionEvents: ActionDefinition<Settings, Payload> = {
  title: 'Conversion Events',
  description:
    'In ecommerce, conversions are purchase events often but not always involving multiple products. Outside of a conversion can be any positive signal associated with an index record. Query ID is optional and indicates that the view events is the result of a search query.',
  fields: {
    products: {
      label: 'Product Details',
      description:
        'Populates the ObjectIds field in the Algolia Insights API. An array of objects representing the purchased items. Each object must contains a product_id field.',
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
      description: 'Query ID of the list on which the item was purchased.',
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
    },
    extraProperties: {
      label: 'extraProperties',
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
      description: "The name of the event to be send to Algolia. Defaults to 'Conversion Event'",
      type: 'string',
      required: true,
      default: 'Conversion Event'
    },
    eventType: {
      label: 'Event Type',
      description: "The type of event to send to Algolia. Defaults to 'conversion'",
      type: 'string',
      required: true,
      default: 'conversion',
      choices: [
        { label: 'view', value: 'view' },
        { label: 'conversion', value: 'conversion' },
        { label: 'click', value: 'click' }
      ]
    }
  },
  defaultSubscription: 'type = "track" and event = "Order Completed"',
  perform: (request, data) => {
    const insightEvent: AlgoliaConversionEvent = {
      ...data.payload.extraProperties,
      eventName: data.payload.eventName ?? 'Conversion Event',
      eventType: (data.payload.eventType as AlgoliaEventType) ?? ('conversion' as AlgoliaEventType),
      index: data.payload.index,
      queryID: data.payload.queryID,
      objectIDs: data.payload.products.map((product) => product.product_id),
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

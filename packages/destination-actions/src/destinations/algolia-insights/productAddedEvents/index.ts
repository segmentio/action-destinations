import type { ActionDefinition, Preset } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { AlgoliaBehaviourURL, AlgoliaConversionEvent, AlgoliaEventType } from '../algolia-insight-api'

export const productAddedEvents: ActionDefinition<Settings, Payload> = {
  title: 'Product Added Events',
  description:
    'Product added events for ecommerce use cases for a customer adding an item to their cart. Query ID is optional and indicates that the event was the result of a search query.',
  fields: {
    product: {
      label: 'Product ID',
      description:
        'Populates the ObjectIds field in the Algolia Insights API with a single ObjectId (productId) of the product added.',
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
      description: "The name of the event to be send to Algolia. Defaults to 'Add to cart'",
      type: 'string',
      required: false,
      default: 'Add to cart'
    },
    eventType: {
      label: 'Event Type',
      description: "The type of event to send to Algolia. Defaults to 'conversion'",
      type: 'string',
      required: false,
      default: 'conversion',
      choices: [
        { label: 'view', value: 'view' },
        { label: 'conversion', value: 'conversion' },
        { label: 'click', value: 'click' }
      ]
    }
  },
  defaultSubscription: 'type = "track" and event = "Product Added"',
  perform: (request, data) => {
    const insightEvent: AlgoliaConversionEvent = {
      ...data.payload.extraProperties,
      eventName: data.payload.eventName ?? 'Add to cart',
      eventType: (data.payload.eventType as AlgoliaEventType) ?? ('conversion' as AlgoliaEventType),
      index: data.payload.index,
      queryID: data.payload.queryID,
      objectIDs: [data.payload.product],
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

export const productAddedPresets: Preset = {
  name: 'Send product added events to Algolia',
  subscribe: productAddedEvents.defaultSubscription as string,
  partnerAction: 'productAddedEvents',
  mapping: defaultValues(productAddedEvents.fields),
  type: 'automatic'
}

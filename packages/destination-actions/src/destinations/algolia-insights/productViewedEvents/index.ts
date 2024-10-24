import type { ActionDefinition, Preset } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import { AlgoliaBehaviourURL, AlgoliaProductViewedEvent, AlgoliaEventType } from '../algolia-insight-api'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

export const productViewedEvents: ActionDefinition<Settings, Payload> = {
  title: 'Product Viewed Events',
  description:
    'Product view events act as a positive signal for associated record objects — the associated Product ID.  Query ID is optional and indicates that the view events is the result of a search query.',
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
      description: "The name of the event to be send to Algolia. Defaults to 'Product Viewed'",
      type: 'string',
      required: false,
      default: 'Product Viewed'
    },
    eventType: {
      label: 'Event Type',
      description: "The type of event to send to Algolia. Defaults to 'view'",
      type: 'string',
      required: false,
      default: 'view',
      choices: [
        { label: 'view', value: 'view' },
        { label: 'conversion', value: 'conversion' },
        { label: 'click', value: 'click' }
      ]
    }
  },
  defaultSubscription: 'type = "track" and event = "Product Viewed"',
  perform: (request, data) => {
    const insightEvent: AlgoliaProductViewedEvent = {
      ...data.payload.extraProperties,
      eventName: data.payload.eventName ?? 'Product Viewed',
      eventType: (data.payload.eventType as AlgoliaEventType) ?? ('view' as AlgoliaEventType),
      index: data.payload.index,
      queryID: data.payload.queryID,
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

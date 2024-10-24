import type { ActionDefinition, Preset } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import { AlgoliaBehaviourURL, AlgoliaProductClickedEvent, AlgoliaEventType } from '../algolia-insight-api'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

export const productClickedEvents: ActionDefinition<Settings, Payload> = {
  title: 'Product Clicked Events',
  description: 'When a product is clicked within an Algolia Search, Recommend or Predict result',
  fields: {
    objectID: {
      label: 'Product ID',
      description: 'Populates the ObjectIds field in the Algolia Insights API. Product ID of the clicked item.',
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
        '@if': {
          exists: { '@path': '$.properties.query_id' },
          then: { '@path': '$.properties.query_id' },
          else: { '@path': '$.integrations.Algolia Insights (Actions).query_id' }
        }
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
      description: "The name of the event to be send to Algolia. Defaults to 'Product Clicked'",
      type: 'string',
      required: false,
      default: 'Product Clicked'
    },
    eventType: {
      label: 'Event Type',
      description: "The type of event to send to Algolia. Defaults to 'click'",
      type: 'string',
      required: false,
      default: 'click',
      choices: [
        { label: 'view', value: 'view' },
        { label: 'conversion', value: 'conversion' },
        { label: 'click', value: 'click' }
      ]
    }
  },
  defaultSubscription: 'type = "track" and event = "Product Clicked"',
  perform: (request, data) => {
    const insightEvent: AlgoliaProductClickedEvent = {
      ...data.payload.extraProperties,
      eventName: data.payload.eventName ?? 'Product Clicked',
      eventType: (data.payload.eventType as AlgoliaEventType) ?? ('click' as AlgoliaEventType),
      index: data.payload.index,
      queryID: data.payload.queryID,
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
export const productClickPresets: Preset = {
  name: 'Send product clicked events to Algolia',
  subscribe: productClickedEvents.defaultSubscription as string,
  partnerAction: 'productClickedEvents',
  mapping: defaultValues(productClickedEvents.fields),
  type: 'automatic'
}

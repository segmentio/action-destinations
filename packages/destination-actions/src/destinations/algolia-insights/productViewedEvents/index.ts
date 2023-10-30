import type { ActionDefinition, Preset } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import { AlgoliaBehaviourURL, AlgoliaProductViewedEvent } from '../algolia-insight-api'
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
    }
  },
  defaultSubscription: 'type = "track" and event = "Product Viewed"',
  perform: (request, data) => {
    const insightEvent: AlgoliaProductViewedEvent = {
      ...data.payload.extraProperties,
      eventName: 'Product Viewed',
      eventType: 'view',
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

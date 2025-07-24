import type { ActionDefinition, Preset } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import { AlgoliaBehaviourURL, AlgoliaProductViewedEvent, AlgoliaEventType } from '../algolia-insight-api'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const segmentEventName = 'Product List Viewed'

export const productListViewedEvents: ActionDefinition<Settings, Payload> = {
  title: `${segmentEventName} Events`,
  description:
    'Product list viewed events act as a positive signal for associated record objects — the associated Product IDs. Query ID is optional and indicates that the view events are the result of a search query.',
  fields: {
    objectIDs: {
      label: 'Product IDs',
      description: 'Product IDs of the viewed items.',
      type: 'string',
      multiple: true,
      required: true,
      default: {
        '@arrayPath': ['$.properties.products', { '@path': '$.product_id' }]
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
      description: 'Query ID of the list on which the items were viewed.',
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
      description:
        'The ID associated with the user. If a user is authenticated, this should be set to the same value as the Authenticated User Token',
      label: 'User Token',
      default: {
        '@if': {
          exists: { '@path': '$.anonymousId' },
          then: { '@path': '$.anonymousId' },
          else: { '@path': '$.userId' }
        }
      }
    },
    authenticatedUserToken: {
      type: 'string',
      description: 'The authenticated ID associated with the user.',
      label: 'Authenticated User Token',
      default: { '@path': '$.userId' }
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
      description: `The name of the event to be send to Algolia. Defaults to '${segmentEventName}'`,
      type: 'string',
      required: false,
      default: segmentEventName
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
  defaultSubscription: `type = "track" and event = "${segmentEventName}"`,
  perform: (request, data) => {
    const insightEvent: AlgoliaProductViewedEvent = {
      ...data.payload.extraProperties,
      eventName: data.payload.eventName ?? segmentEventName,
      eventType: (data.payload.eventType as AlgoliaEventType) ?? ('view' as AlgoliaEventType),
      index: data.payload.index,
      queryID: data.payload.queryID,
      objectIDs: data.payload.objectIDs,
      timestamp: data.payload.timestamp ? new Date(data.payload.timestamp).valueOf() : undefined,
      userToken: data.payload.userToken,
      authenticatedUserToken: data.payload.authenticatedUserToken
    }
    const insightPayload = { events: [insightEvent] }

    return request(AlgoliaBehaviourURL, {
      method: 'post',
      json: insightPayload
    })
  }
}

/** used in the quick setup */
export const productListViewedPresets: Preset = {
  name: 'Send product list viewed events to Algolia',
  subscribe: productListViewedEvents.defaultSubscription as string,
  partnerAction: 'productListViewedEvents',
  mapping: defaultValues(productListViewedEvents.fields),
  type: 'automatic'
}

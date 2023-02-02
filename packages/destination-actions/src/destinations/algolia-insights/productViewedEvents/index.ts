import type { ActionDefinition } from '@segment/actions-core'
import { Subscription, defaultValues } from '@segment/actions-core'
import { AlgoliaBehaviourURL, AlgoliaProductViewedEvent } from '../algolia-insight-api'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const userIdOrAnonId = (user: string | undefined, anon: string | undefined): string => (user || anon) as string

export const productViewedEvents: ActionDefinition<Settings, Payload> = {
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
      description:
        "The user's anonymous id. Optional if User ID is provided. See Segment [common fields documentation](https://segment.com/docs/connections/spec/common/)",
      type: 'string',
      required: false,
      default: { '@path': '$.anonymousId' }
    },
    userID: {
      type: 'string',
      required: false,
      description:
        'The ID associated with the user. Optional if Anonymous ID is provided. See Segment [common fields documentation](https://segment.com/docs/connections/spec/common/)',
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
  defaultSubscription: 'type = "track" and event = "Product Viewed"',
  perform: (request, data) => {
    const insightEvent: AlgoliaProductViewedEvent = {
      ...data.payload,
      eventName: 'Product Viewed',
      eventType: 'view',
      objectIDs: [data.payload.objectID],
      timestamp: data.payload.timestamp ? new Date(data.payload.timestamp).valueOf() : undefined,
      userToken: userIdOrAnonId(data.payload.userID, data.payload.anonymousID)
    }
    const insightPayload = { events: [insightEvent] }

    return request(AlgoliaBehaviourURL, {
      method: 'post',
      json: insightPayload
    })
  }
}

/** used in the quick setup */
export const productViewedPresets: Subscription = {
  name: 'Send product viewed events to Algolia',
  subscribe: productViewedEvents.defaultSubscription as string,
  partnerAction: 'productViewedEvents',
  mapping: defaultValues(productViewedEvents.fields)
}

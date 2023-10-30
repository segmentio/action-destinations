import type { ActionDefinition, Preset } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import { AlgoliaBehaviourURL, AlgoliaFilterClickedEvent } from '../algolia-insight-api'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

export const productListFilteredEvents: ActionDefinition<Settings, Payload> = {
  title: 'Product List Filtered Events',
  description: 'When a product list is filtered within an Algolia Search',
  fields: {
    filters: {
      label: 'Filters',
      description:
        'Populates the filters field in the Algolia Insights API, a list of up to 10 facet filters. Field should be an array of strings with format ${attribute}:${value}.',
      type: 'object',
      multiple: true,
      required: true,
      defaultObjectUI: 'keyvalue',
      additionalProperties: false,
      properties: {
        attribute: { label: 'Filter name', description: 'The name of the Filter', type: 'string', required: true },
        value: { label: 'Filter value', description: 'The value of the Filter', type: 'string', required: true }
      },
      default: {
        '@arrayPath': ['$.properties.filters', { attribute: { '@path': '$.attribute' }, value: { '@path': '$.value' } }]
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
  defaultSubscription: 'type = "track" and event = "Product List Filtered"',
  perform: (request, data) => {
    const filters: string[] = data.payload.filters.map(({ attribute, value }) => `${attribute}:${value}`)
    const insightEvent: AlgoliaFilterClickedEvent = {
      ...data.payload.extraProperties,
      eventName: 'Product List Filtered',
      eventType: 'click',
      index: data.payload.index,
      queryID: data.payload.queryID,
      filters,
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
export const productListFilteredPresets: Preset = {
  name: 'Send product list filtered events to Algolia',
  subscribe: productListFilteredEvents.defaultSubscription as string,
  partnerAction: 'productListFilteredEvents',
  mapping: defaultValues(productListFilteredEvents.fields),
  type: 'automatic'
}

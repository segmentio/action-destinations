import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import omit from 'lodash/omit'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Send an analytics event to Optimizely',
  defaultSubscription: 'type = "track" or type = "page"',
  fields: {
    endUserId: {
      label: 'Optimizely End User ID',
      description: "The unique identifier for the user. The value should be taken from the optimizelyEndUserId cookie, or it can be collected using window.optimizely.get('visitor').visitorId. If using the BYOID feature pass in the value of the ID for your user.",
      type: 'string',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.integrations.actions-optimizely-web.end_user_id' },
          then: { '@path': '$.integrations.actions-optimizely-web.end_user_id' },
          else: { '@path': '$.properties.end_user_id' }
        }
      }
    }, 
    projectID: {
      label: 'Optimizely Project ID',
      description: 'The unique identifier for the project.',
      type: 'string',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.integrations.actions-optimizely-web.project_id' },
          then: { '@path': '$.integrations.actions-optimizely-web.project_id' },
          else: { '@path': '$.properties.project_id' }
        }
      }
    },
    eventName: {
      label: 'Event Name',
      description: 'Event Name.',
      type: 'string',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.event' },
          then: { '@path': '$.event' },
          else: { '@path': '$.name' }
        }
      }
    },
    timestamp:{
      label: 'Timestamp', 
      description: "Timestampt for when the event took place",
      type: 'datetime',
      required: true,
      default: { '@path': '$.timestamp' }
    },
    uuid:{
      label: 'UUID', 
      description: "Unique message UUID to send with the event",
      type: 'string',
      required: true,
      default: { '@path': '$.messageId' }
    },
    type:{
      label: 'Event Type', 
      description: "The type of Segment event",
      type: 'string',
      required: true,
      default: { '@path': '$.type' }
    },
    tags:{
      label: 'Tags', 
      description: "Tags to send with the event",
      type: 'object',
      required: false,
      properties: {
        revenue: {
          label: 'Revenue', 
          description: "The currency amount associated with the event. For example for $20.05 USD send 20.05",
          type: 'number',
          required: false,
        },
        value: {
          label: 'Value', 
          description: "Value associated with the event.",
          type: 'number',
          required: false,
        },
        currency: {
          label: 'Currency', 
          description: "Currency code for revenue. Defaults to USD.", 
          type: 'string',
          required: false,
          default: 'USD'
        },
      },
      default: { '@path': '$.properties' }
    }
  },
  perform: (request, { payload, settings}) => {

    // check cache for Entity ID keyed off of event name
    // if not found, make api request to get entity id. Use the projectId to get the Entity ID
    // TBC: if still not found, make api request to create entity id
    // if found, use it
    // Otherwise throw error 

    const { type, eventName, endUserId, projectId, timestamp, type, tags } = payload

    const { value, revenue } = tags

    const entity_id = getEntityIdFromCache()

    const eventName = eventName ?? type === 'page' ? 'page_viewed' : undefined
    const revenue = revenue ? revenue * 100 : undefined
    const value = value ?? undefined
    const properties = {...omit(tags, ['value', 'revenue'])} ?? {},
    
    const data = {
      account_id: settings.optimizelyAccountId,
      visitors: [
        visitor_id: payload.endUserId,
        attributes: [],  // user profile details 
        snapshots: [
          decisions: [], // leave as empty array
          events: [
            {
              entity_id: entity_id,
              key: eventName,
              tags, // TODO remove revenue from tags
              revenue,
              value,
              timestamp: payload.timestamp,
              uuid
            }
          ]
        ]
      ]
    }

    // Make your partner api request here!
    return request('https://logx.optimizely.com/v1/events', {
      method: 'post',
      json: data,
      headers: {
        'content-type': 'application/json'
      }
    })

  }
}

export default action

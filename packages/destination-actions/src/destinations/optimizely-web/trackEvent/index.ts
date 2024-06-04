import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { omit } from '@segment/actions-core'
import { snakeCase } from 'lodash';
import { OptimizelyWebClient, Body } from './utils'
import { IntegrationError } from '@segment/actions-core/'

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
    createEventIfNotFound: {
      label: 'Create Custom Event',
      description: "Segment will create a new Custom Event in Optimizely if the Custom Event doesn't already exist.",
      type: 'string',
      choices: [
        { label: 'DO_NOT_CREATE', value: 'Do not create' },
        { label: 'CREATE', value: 'Create Custom Event' },
        { label: 'CREATE_SNAKE_CASE', value: 'Create Custom Event - snake_case' },
      ],
      required: true,
      default: 'CREATE'
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
        quantity: {
          label: 'Quantity', 
          description: "The quantity of items associated with the event.",
          type: 'integer',
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
      default: { 
        revenue: {
          '@path': '$.properties.revenue'
        },
        value: {
          '@path': '$.properties.value'
        },
        quantity: {
          '@path': '$.properties.quantity'
        },
        currency: {
          '@path': '$.properties.currency'
        }
      }
    },
    properties: {
      label: 'Properties',
      description: 'Additional properties to send with the event.',
      type: 'object',
      required: false,
      default: { '@path': '$.properties' }
    }
  },
  perform: async (request, { payload, settings, stateContext}) => {

    /* 
    logic: 

    Look in cache for event with name = payload.eventName or snake cased payload.eventName

    if event name not in cache 
      fetch list of all event names from Optimizely and update cache
      check cache again for event with name = payload.eventName or snake cased payload.eventName
        if found, get id for event
          send event to Optimzely 

    if event name not in cache 
      create new event with name = payload.eventName or snake cased payload.eventName
        get id for event
          send event to Optimzely
        
    */
    if(!stateContext) {
      throw new IntegrationError('State Context is not available', 'MISSING_STATE_CONTEXT', 400)
    }

    const client = new OptimizelyWebClient(request, stateContext)
    const { type, endUserId, eventName, projectID, timestamp, properties, uuid, tags = {} } = payload;
    const { value, revenue, quantity } = tags;
    const event_name = payload.createEventIfNotFound === 'CREATE_SNAKE_CASE' ? snakeCase(eventName) : eventName
    
    let entity_id = client.getEventIdFromCache(event_name)

    if(!entity_id && payload.createEventIfNotFound !== 'DO_NOT_CREATE') {
        await client.updateCachedEventNames(projectID)
        entity_id = client.getEventIdFromCache(event_name)
        if(!entity_id) { 
          await client.createEvent(projectID, event_name, eventName)
          await client.updateCachedEventNames(projectID)
          entity_id = client.getEventIdFromCache(event_name)
        }
    }

    if(!entity_id) {
      throw new IntegrationError(`Event with name ${eventName} not found`, 'EVENT_NOT_FOUND', 400)
    }

    const body: Body = {
      account_id: settings.optimizelyAccountId,
      visitors: [
        {
          visitor_id: endUserId,
          attributes: [], // should be empty array
          snapshots: [
            {
              decisions: [], // should be empty array
              events: [
                {
                  entity_id,
                  key: eventName ?? type === 'page' ? 'page_viewed' : undefined,
                  timestamp,
                  uuid,
                  type: "other",
                  tags: {
                    revenue: revenue ? revenue * 100 : undefined,
                    value,
                    quantity
                  },
                  properties: {...omit(properties, ['value', 'revenue', 'quantity', 'currency'])} ?? {}
                }
              ]
            }
          ]
        }
      ],
      anonymize_ip: true,
      client_name: 'Optimizely/event-api-demo',
      client_version: '1.0.0',
      enrich_decisions: true
    }

    await client.sendEvent(body)

  }
}

export default action

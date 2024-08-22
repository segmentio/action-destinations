import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { omit } from '@segment/actions-core'
import  snakeCase from 'lodash/snakeCase' 
import { OptimizelyWebClient, Body } from './utils'
import { IntegrationError } from '@segment/actions-core/'
import { OptimizelyPayload, Visitor, Event } from './types'

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
    anonymizeIP: {
      label: 'Anonymize IP',
      description: 'Anonymize the IP address of the user.',
      type: 'boolean',
      required: true,
      default: true
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
    category: {
      label: 'Event Category',
      description: 'Event Category',
      type: 'string',
      required: true,
      choices: [
        { label: 'add_to_cart', value: 'add_to_cart' },
        { label: 'save', value: 'save' },
        { label: 'search', value: 'search' },
        { label: 'share', value: 'share' },
        { label: 'purchase', value: 'purchase' },
        { label: 'convert', value: 'convert' },
        { label: 'sign_up', value: 'sign_up' },
        { label: 'subscribe', value: 'subscribe' },
        { label: 'other', value: 'other' }
      ],
      default: 'other'
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
    eventType:{
      label: 'Event Type', 
      description: "The type of Segment event",
      type: 'string',
      unsafe_hidden: true,
      required: true,
      default: { '@path': '$.type' }
    },
    tags:{
      label: 'Tags', 
      description: "Tags to send with the event",
      type: 'object',
      required: false,
      additionalProperties: true,
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
        }
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

    if(!stateContext) {
      throw new IntegrationError('stateContext is not available', 'MISSING_STATE_CONTEXT', 400)
    }

    const { 
      eventType, 
      endUserId, 
      eventName: friendlyEventName, 
      category, 
      projectID, 
      timestamp, 
      properties, 
      uuid, 
      tags: { value, revenue, quantity } = {} 
    } = payload;

    const event_name = payload.createEventIfNotFound === 'CREATE_SNAKE_CASE' ? snakeCase(friendlyEventName) : friendlyEventName
    
    const client = new OptimizelyWebClient(request, projectID, stateContext)

    let event = client.getEventFromCache(event_name)

    if(typeof event === 'undefined' && payload.createEventIfNotFound !== 'DO_NOT_CREATE') {
        event = await client.getEventFromOptimzely(event_name)
        
        if(typeof event === 'undefined') { 
          event = await client.createEvent(event_name, friendlyEventName, category)
          if(!event) {
            throw new IntegrationError(`Enable to create event with name ${event_name} in Optimizely`, 'EVENT_CREATION_ERROR', 400)
          }
          await client.updateCache(event)
        }
    }

    if(typeof event === 'undefined') {
      throw new IntegrationError(`Event with name ${event_name} not found`, 'EVENT_NOT_FOUND', 400)
    }

    const key = 

    const body: OptimizelyPayload = {
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
                  entity_id: String(event.id),
                  key: event_name ?? eventType === 'page' ?? 'page_viewed',
                  timestamp: new Date(timestamp as string).getTime(), // TODO - fix so this is always 13 digit unix
                  uuid,
                  type,
                  tags: {
                    revenue: revenue ? revenue * 100 : undefined,
                    value,
                    quantity
                  },
                  properties: {...omit(properties, ['value', 'revenue', 'quantity', 'currency'])}
                }
              ]
            }
          ]
        }
      ],
      anonymize_ip: payload.anonymizeIP,
      client_name: 'Segment Optimizely Web Destination',
      client_version: '1.0.0',
      enrich_decisions: true
    }

    await client.sendEvent(body)

  }
}

export default action

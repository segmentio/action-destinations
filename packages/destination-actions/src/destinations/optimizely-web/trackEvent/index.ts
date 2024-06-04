import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { omit } from '@segment/actions-core'

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
  perform: (request, { payload, settings}) => {


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


    // check cache for Entity ID keyed off of event name
    // if not found, make api request to get entity id. Use the projectId to get the Entity ID
    // TBC: if still not found, make api request to create entity id
    // if found, use it
    // Otherwise throw error 

    const { type, endUserId, eventName, projectID, timestamp, properties, uuid, tags = {} } = payload;
    const { value, revenue, quantity } = tags;

    const entity_id = await getEntityIdFromCache(projectID)


    // payload to retrieve list of events
    // https://docs.developers.optimizely.com/feature-experimentation/reference/list_events  

    // const endpoint = 'https://logx.optimizely.com/v1/events?per_page=100&page=1&include_classic=false&project_id=12345678'

    // response should look like this 
    // [
    //   {
    //     "archived": true,
    //     "category": "add_to_cart",
    //     "config": {
    //       "selector": ".menu-options"
    //     },
    //     "created": "2024-06-04T14:06:03.201Z",
    //     "description": "Item added to cart",
    //     "event_type": "custom",
    //     "id": 0,
    //     "is_classic": false,
    //     "is_editable": true,
    //     "key": "add_to_cart",
    //     "last_modified": "2024-06-04T14:06:03.201Z",
    //     "name": "Add to Cart",
    //     "page_id": 5000,
    //     "project_id": 1000
    //   }
    // ]

    // key and id should be added to a cache 


    // payload to create an event in Optimizely 
    // https://docs.developers.optimizely.com/feature-experimentation/reference/create_custom_event 

    // POST to https://api.optimizely.com/v2/projects/123456787654/custom_events
    // header 'accept: application/json' \
    // header 'content-type: application/json'

    // 123456787654 is the project_id 

    // response 
    // {
    //   "archived": true,
    //   "category": "add_to_cart",
    //   "created": "2024-06-04T14:06:03.201Z",
    //   "description": "string",
    //   "event_type": "custom",
    //   "id": 0,
    //   "is_classic": false,
    //   "is_editable": true,
    //   "key": "loaded_new_app",
    //   "name": "Loaded New App",
    //   "project_id": 1000
    // }



    const body = {
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

    // Make your partner api request here!
    const endpoint = 'https://logx.optimizely.com/v1/events';

    return request(endpoint, {
      method: 'post',
      json: body,
      headers: {
        'content-type': 'application/json'
      }
    })

  }
}

export default action

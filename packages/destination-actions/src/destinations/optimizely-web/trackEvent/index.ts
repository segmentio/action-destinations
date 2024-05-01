import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Send an analytics event to Optimizely',
  defaultSubscription: 'type = "track"',
  fields: {
    endUserId: {
      label: 'Optimizely End User ID',
      description: "The unique identifier for the user. The value should be taken from the optimizelyEndUserId cookie, or it can be collected using window.optimizely.get('visitor').visitorId. If using the BYOID feature pass in the value of the ID for your user.",
      type: 'string',
      required: true,
      default: { '@path': '$.integrations.actions-optimizely-web.optimizelyEndUserId' }
    }
  },
  perform: (request, data) => {


    const data = {
      account_id: settings.optimizelyAccountId,
      visitors: [
        visitor_id: ,
        attributes: [],
        snapshots: [
          decisions: [],
          events: [
            {
              entity_id: entity_id,
              key: eventName,
              revenue: revenue,
              value: value,
              timestamp: Date.now(),
              uuid: uuidv4() // need to add function to generate uuid
            }
          ]
        ]
      ]
      
    }


    // Make your partner api request here!
    // return request('https://example.com', {
    //   method: 'post',
    //   json: data.payload
    // })
  },

  performBatch: (request, data) => {
    
  }
}


{
  account_id: 
  visitors: [
    {
      visitor_id: visitor_id,
      attributes: [],
      snapshots: [
        {
          decisions: [],
          events: [
            {
              entity_id: entity_id,
              key: eventName,
              revenue: revenue,
              value: value,
              timestamp: Date.now(),
              uuid: uuidv4() // need to add function to generate uuid
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

export default action

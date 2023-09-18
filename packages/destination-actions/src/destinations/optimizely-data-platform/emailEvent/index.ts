import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getEmailEventType, hosts } from '../utils'
import { timestamp } from '../fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Email Event',
  description: 'Send email event to Optimizely',
  fields: {
    event_action: {
      label: 'Event Action',
      description: 'The name of the event',
      type: 'string',
      required: true,
      default: {
          '@path': '$.event'
      }
    },
    email: {
      label: 'Email',
      description: "The user's email",
      type: 'string',
      format: 'email',
      required: true, 
      default: {
        '@if': {
          exists: { '@path': '$.properties.email' },
          then: { '@path': '$.properties.email' },
          else: { '@path': '$.context.traits.email' }
        }
      }
    },
    campaign_id: {
      label: 'Campaign ID',
      description: "The campaign unique identifier",
      type: 'string',
      default: {
        '@path': '$.properties.campaign_id'
      }
    },
    campaign: {
      label: 'Campaign Name',
      description: "The campaign name",
      type: 'string',
      required: true,
      default: {
        '@path': '$.properties.campaign_name'
      }
    },
    link_url: {
      label: 'Link URL',
      description: 'URL of the link which was clicked',
      type: 'string',
      default: {
        '@path': '$.properties.link_url'
      }
    },
    timestamp: {...timestamp}
  },
  perform: (request, { payload, settings }) => {
    const host = hosts[settings.region]

    const body = {
      type: 'email',
      action: getEmailEventType[payload.event_action],
      campaign: payload.campaign,
      email: payload.email,
      campaign_event_value: payload.link_url ?? null,
      timestamp: payload.timestamp
    };
    
    return request(`${host}/email_event`, {
      method: 'post',
      json: body
    });
  }
}

export default action

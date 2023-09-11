import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getEmailEventType } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Email Event',
  description: '',
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
    email_id: {
      label: 'Email ID',
      description: "The email unique identifier",
      type: 'string',
      default: {
        '@path': '$.properties.email_id'
      }
    },
    email: {
      label: 'Email',
      description: "The user's email",
      type: 'string',
      format: 'email',
      default: {
        '@path': '$.context.traits.email'
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
      default: {
        '@path': '$.properties.campaign_name'
      }
    },
    link_url: {
      label: 'Email Link Clicked',
      description: 'The link that is clicked in email',
      type: 'string',
      default: {
        '@path': '$.properties.link_url'
      }
    }
  },
  perform: (request, { payload }) => {
    const body = {
      type: 'email',
      action: getEmailEventType[payload.event_action],
      campaign: payload.campaign,
      email: payload.email,
      campaign_event_value: payload.link_url
    };

    if (payload.event_action === 'Unsubscribed') {
      body.type = 'consent'
    }
    
    return request('https://example.com', {
      method: 'post',
      json: body
    });
  }
}

export default action

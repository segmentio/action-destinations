import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { timestamp, email_action_identifiers } from '../fields'
import { hosts } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Email Event',
  description: 'Send email related Segment track() events to Optimizely Data Platform',
  fields: {
    user_identifiers: email_action_identifiers,
    event_action: {
      label: 'Optimizely Event Action',
      description: 'The name of the Optimizely Event Action.',
      type: 'string',
      required: true
    },
    campaign: {
      label: 'Campaign Name',
      description: 'The campaign name',
      type: 'string',
      required: true,
      default: {
        '@path': '$.properties.campaign_name'
      }
    },
    campaign_id: {
      label: 'Campaign ID',
      description: 'The campaign unique identifier',
      type: 'string',
      default: {
        '@path': '$.properties.campaign_id'
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
    timestamp: { ...timestamp }
  },
  perform: (request, { payload, settings }) => {
    const host = hosts[settings.region]

    const body = {
      type: 'email',
      action: payload.event_action,
      campaign: payload.campaign,
      campaign_id: payload.campaign_id,
      user_identifiers: payload.user_identifiers,
      campaign_event_value: payload.link_url ?? null,
      timestamp: payload.timestamp
    }

    return request(`${host}/email_event`, {
      method: 'post',
      json: body
    })
  }
}

export default action

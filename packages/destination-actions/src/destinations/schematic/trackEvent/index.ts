import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

function snakeCase(str: string) {
  const result = str.replace(/([A-Z])/g, '$1')
  return result.split(' ').join('_').toLowerCase()
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Send track events to Schematic',
  defaultSubscription: 'type = "track"',
  fields: {
    event_name: {
      label: 'Event name',
      description: 'Name of event (this will be snake cased in request)',
      type: 'string',
      required: true,
      default: { '@path': '$.event' }
    },
    company_keys: {
      label: 'Company keys',
      description: 'Key-value pairs associated with a company (e.g. organization_id: 123456)',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      additionalProperties: true,
      required: false
    },
    timestamp: {
      label: 'Timestamp',
      description: 'Time the event took place',
      type: 'datetime',
      required: true,
      default: { '@path': '$.timestamp' }
    },
    user_keys: {
      label: 'User keys',
      description: 'Key-value pairs associated with a user (e.g. email: example@example.com)',
      type: 'object',
      required: false,
      defaultObjectUI: 'keyvalue',
      additionalProperties: true,
      default: {
        userId: { '@path': '$.userId' }
      }
    },
    traits: {
      label: 'Traits',
      description: 'Additional properties to send with event',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      required: false,
      additionalProperties: true,
      properties: {
        raw_event_name: {
          label: 'Raw Event Name',
          description: 'Event name',
          type: 'string',
          required: false
        }
      },
      default: {
        raw_event_name: { '@path': '$.event' }
      }
    }
  },

  perform: (request, { settings, payload }) => {
    return request('https://c.schematichq.com/e', {
      method: 'post',
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      json: {
        api_key: `${settings.apiKey}`,
        type: 'track',
        sent_at: new Date(payload.timestamp).toISOString(),
        body: {
          traits: payload.traits,
          company: payload.company_keys,
          user: payload.user_keys,
          event: snakeCase(payload.event_name)
        }
      }
    })
  }
}

export default action

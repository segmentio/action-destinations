import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Send track events to Schematic',
  defaultSubscription: 'type = "track"',
  fields: {
    event_name: {
      label: 'Event name',
      description: 'Name of event',
      type: 'string',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.event' },
          then: { '@path': '$.event' }
        }
      }
    },
    company_keys: {
      label: 'Company keys',
      description: 'Key-value pairs associated with a company (e.g. organization_id: 123456)',
      type: 'object',
      required: false,
      properties: {
        groupId: {
          label: 'groupId',
          description: 'Segment groupId',
          type: 'string',
          required: false
        },
        organization_id: {
          label: 'Organization ID',
          description: 'Organization ID',
          type: 'string',
          required: false
        }
      },
      default: {
        groupId: {
          '@if': {
            exists: { '@path': '$.groupId' },
            then: { '@path': '$.groupId' },
            else: { '@path': '$.context.groupId' }
          }
        },
        organization_id: { '@path': '$.properties.organization_id' }
      }
    },
    user_keys: {
      label: 'User keys',
      description: 'Key-value pairs associated with a user (e.g. email: example@example.com)',
      type: 'object',
      required: false,
      properties: {
        userId: {
          label: 'userId',
          description: 'Segment userId',
          type: 'string',
          required: false
        }
      },
      default: {
        userId: {
          '@if': {
            exists: { '@path': '$.userId' },
            then: { '@path': '$.userId' },
            else: { '@path': '$.context.userId' }
          }
        }
      }
    },
    traits: {
      label: 'Traits',
      description: 'Additional properties to send with event',
      type: 'object',
      required: false
    }
  },

  perform: (request, { settings, payload }) => {
    return request('https://api.schematichq.com/events', {
      method: 'post',
      headers: { 'X-Schematic-Api-Key': `${settings.apiKey}` },
      responseType: 'json',
      json: {
        body: {
          company: payload.company_keys,
          user: payload.user_keys,
          traits: payload.traits,
          event: payload.event_name
        },
        event_type: 'track'
      }
    })
  }
}

export default action

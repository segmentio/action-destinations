import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { API_URL } from '../constants'
import { user_id, email, created_at } from '../properties'
import { buildJSON } from './functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Send a Segment track event to Vero.',
  defaultSubscription: 'type = "track"',
  fields: {
    userId: user_id,
    email: {
      ...email,
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.email' },
          then: { '@path': '$.context.traits.email' },
          else: { '@path': '$.properties.email' }
        }
      }
    },
    eventName: {
      label: 'Event Name',
      description: 'The name of the event.',
      type: 'string',
      required: true,
      default: { '@path': '$.event' }
    },
    properties: {
      label: 'Event Properties',
      description: 'Properties of the event. All values are sent to Vero as strings.',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      default: { '@path': '$.properties' }
    },
    deduplicationValue: {
      label: 'Deduplication Value',
      description:
        'Vero drops events with the same name, properties and user within 5 minutes. Map a unique value, such as the Segment message ID, to make each event unique. Sent to Vero as the segment_event_id event property. Leave empty to keep Vero deduplication.',
      type: 'string'
    },
    createdAt: {
      ...created_at,
      label: 'Event Timestamp'
    }
  },
  perform: (request, { payload }) => {
    return request(`${API_URL}/events/track`, {
      method: 'post',
      json: buildJSON(payload)
    })
  }
}

export default action

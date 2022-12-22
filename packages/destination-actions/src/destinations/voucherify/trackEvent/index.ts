import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
// import { trackApiEndpoint } from '../utils'

interface TrackEventPayload {
  source_id?: string
  event: string
  type?: string
  created_at?: string
  metadata?: Record<string, unknown>
  // anonymous_id?: string
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Track an event.',
  fields: {
    source_id: {
      label: 'Voucherify Customer ID',
      description: 'The unique ID that identifies customer in Voucherify.',
      type: 'string',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.email' }
        }
      }
    },

    event: {
      label: 'Event Name',
      description: 'The name of the event.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    },

    created_at: {
      label: 'Timestamp',
      description: 'When the event took place.',
      type: 'string',
      default: {
        '@path': '$.timestamp'
      }
    },
    metadata: {
      label: 'Event Metadata',
      description: 'Optional data to include with the event.',
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    }
  },

  perform: (request, { payload }) => {
    const body: TrackEventPayload = {
      source_id: payload.source_id,
      event: payload.event,
      metadata: payload.metadata,
      created_at: payload.created_at
    }

    // const url = `${trackApiEndpoint(settings.apiEndpoint)}/v1/events`
    const url = `http://localhost:3005/segmentio/event-processing`

    return request(url, {
      method: 'post',
      json: body
    })
  }
}

export default action

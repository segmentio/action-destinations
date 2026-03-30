import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create Usage Event',
  description: 'Send a usage event to Lark for billing and metering purposes.',
  defaultSubscription: 'type = "track"',
  fields: {
    event_name: {
      label: 'Event Name',
      description: 'The name of the event. This is used by pricing metrics to aggregate usage events.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    subject_id: {
      label: 'Subject ID',
      description: 'The ID or external ID of the subject that the usage event is for.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.userId'
      }
    },
    idempotency_key: {
      label: 'Idempotency Key',
      description:
        'The idempotency key for the usage event. This ensures that the same event is not processed multiple times.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.messageId'
      }
    },
    timestamp: {
      label: 'Timestamp',
      description:
        'The timestamp of the usage event (ISO 8601 format). If not provided, the current timestamp will be used.',
      type: 'datetime',
      required: false,
      default: {
        '@path': '$.timestamp'
      }
    },
    data: {
      label: 'Data',
      description:
        'The data of the usage event. This should contain any data that is needed to aggregate the usage event.',
      type: 'object',
      required: false,
      default: {
        '@path': '$.properties'
      }
    }
  },
  perform: (request, { settings, payload }) => {
    return request('https://api.uselark.ai/usage-events', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': settings.apiKey
      },
      json: {
        event_name: payload.event_name,
        subject_id: payload.subject_id,
        idempotency_key: payload.idempotency_key,
        timestamp: payload.timestamp,
        data: payload.data
      }
    })
  }
}

export default action

import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { sendBatch, sendSingle } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Screen View',
  description: 'Track a screen view for a known or anonymous person.',
  defaultSubscription: 'type = "screen"',
  fields: {
    id: {
      label: 'Person ID',
      description:
        'The ID used to uniquely identify a person in Customer.io. [Learn more](https://customer.io/docs/identifying-people/#identifiers).',
      type: 'string',
      default: {
        '@path': '$.userId'
      }
    },
    anonymous_id: {
      label: 'Anonymous ID',
      description:
        'An anonymous ID for when no Person ID exists. [Learn more](https://customer.io/docs/anonymous-events/).',
      type: 'string',
      default: {
        '@path': '$.anonymousId'
      }
    },
    event_id: {
      label: 'Event ID',
      description:
        'An optional identifier used to deduplicate events. [Learn more](https://customer.io/docs/api/#operation/track).',
      type: 'string',
      default: {
        '@path': '$.messageId'
      }
    },
    name: {
      label: 'Screen name',
      description: 'The name of the screen visited.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.name'
      }
    },
    timestamp: {
      label: 'Timestamp',
      description: 'A timestamp of when the event took place. Default is current date and time.',
      type: 'string',
      default: {
        '@path': '$.timestamp'
      }
    },
    data: {
      label: 'Event Attributes',
      description: 'Optional data to include with the event.',
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    },
    convert_timestamp: {
      label: 'Convert Timestamps',
      description: 'Convert dates to Unix timestamps (seconds since Epoch).',
      type: 'boolean',
      default: true
    }
  },

  performBatch: (request, { payload: payloads, settings }) => {
    return sendBatch(
      request,
      payloads.map((payload) => ({ action: 'screen', payload: mapPayload(payload), settings, type: 'person' }))
    )
  },

  perform: (request, { payload, settings }) => {
    return sendSingle(request, { action: 'screen', payload: mapPayload(payload), settings, type: 'person' })
  }
}

function mapPayload(payload: Payload) {
  const { id, event_id, data, ...rest } = payload
  const result: {
    id?: string
    person_id?: string
    attributes?: Record<string, unknown>
  } = {
    ...rest,
    person_id: id,
    attributes: data
  }

  if (event_id) {
    result.id = event_id
  }

  return result
}

export default action

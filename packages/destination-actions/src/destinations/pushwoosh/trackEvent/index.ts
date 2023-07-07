import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { sendBatchedPostEvent, sendPostEvent } from '../utilities'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Record custom events in Pushwoosh',
  defaultSubscription: 'type = "track"',
  fields: {
    external_id: {
      label: 'External User ID',
      description: 'The unique user identifier',
      type: 'string',
      required: true,
      default: {
        '@path': '$.userId'
      }
    },
    device_id: {
      label: 'Device ID',
      description: 'Device ID',
      type: 'string',
      allowNull: true,
      default: {
        '@path': '$.context.device.id'
      }
    },
    device_platform: {
      label: 'Device Platform',
      description: 'Device Platform',
      type: 'string',
      allowNull: true,
      default: {
        '@path': '$.context.device.type'
      }
    },
    name: {
      label: 'Name',
      description: 'Event Name',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    timestamp: {
      label: 'Timestamp',
      description: 'When the event occurred.',
      type: 'datetime',
      required: true,
      default: {
        '@path': '$.timestamp'
      }
    },
    properties: {
      label: 'Event Properties',
      description: 'Properties of the event',
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    },
    enable_batching: {
      type: 'boolean',
      label: 'Batch Data to Pushwoosh',
      description: 'If true, Segment will batch events before sending to Pushwoosh. 100 events per request max.',
      default: false
    }
  },
  perform: (request, { settings, payload }) => {
    return sendPostEvent(request, settings, payload)
  },
  performBatch: (request, { settings, payload }) => {
    return sendBatchedPostEvent(request, settings, payload)
  }
}

export default action

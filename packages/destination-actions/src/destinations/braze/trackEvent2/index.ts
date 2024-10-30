import type { ActionDefinition } from '@segment/actions-core'
import { IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { sendTrackEvent, sendBatchedTrackEvent, generateMultiStatusError } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event V2',
  description: 'Record custom events in Braze',
  defaultSubscription: 'type = "track" and event != "Order Completed"',
  fields: {
    external_id: {
      label: 'External User ID',
      description: 'The unique user identifier',
      type: 'string',
      default: {
        '@path': '$.userId'
      }
    },
    user_alias: {
      label: 'User Alias Object',
      description:
        'A user alias object. See [the docs](https://www.braze.com/docs/api/objects_filters/user_alias_object/).',
      type: 'object',
      properties: {
        alias_name: {
          label: 'Alias Name',
          type: 'string'
        },
        alias_label: {
          label: 'Alias Label',
          type: 'string'
        }
      }
    },
    email: {
      label: 'Email',
      description: 'The user email',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.email' },
          then: { '@path': '$.context.traits.email' },
          else: { '@path': '$.properties.email' }
        }
      }
    },
    braze_id: {
      label: 'Braze User Identifier',
      description: 'The unique user identifier',
      type: 'string',
      allowNull: true,
      default: {
        '@path': '$.properties.braze_id'
      }
    },
    name: {
      label: 'Event Name',
      description: 'The event name',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    time: {
      label: 'Time',
      description: 'When the event occurred.',
      type: 'datetime',
      required: true,
      default: {
        '@path': '$.receivedAt'
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
      label: 'Batch Data to Braze',
      description:
        'If true, Segment will batch events before sending to Braze’s user track endpoint. Braze accepts batches of up to 75 events.',
      default: true
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
      type: 'number',
      default: 75,
      unsafe_hidden: true
    }
  },
  syncMode: {
    description: 'Define how the records from your destination will be synced.',
    label: 'How to track events',
    default: 'add',
    choices: [
      { label: 'Add Profile with Event', value: 'add' },
      { label: 'Update Profile with Event', value: 'update' }
    ]
  },
  perform: (request, { settings, payload, syncMode }) => {
    if (syncMode === 'add' || syncMode === 'update') {
      return sendTrackEvent(request, settings, payload, syncMode)
    }
    throw new IntegrationError('syncMode must be "add" or "update"', 'Invalid syncMode', 400)
  },
  performBatch: (request, { settings, payload, syncMode }) => {
    if (syncMode === 'add' || syncMode === 'update') {
      return sendBatchedTrackEvent(request, settings, payload, syncMode)
    }

    // Return a multi-status error if the syncMode is invalid
    return generateMultiStatusError(payload.length, 'Invalid syncMode, must be set to "add" or "update"')
  }
}

export default action

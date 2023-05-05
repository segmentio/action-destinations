import type { ActionDefinition } from '@segment/actions-core'
import type { Payload } from './generated-types'
import type { Settings } from '../generated-types'
import { setCustomEvent } from '../utilities'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Custom Events',
  description: 'Set Custom Events on Users',
  defaultSubscription: 'type = "track"',
  fields: {
    named_user_id: {
      label: 'Airship Named User ID',
      description: 'The identifier assigned in Airship as the Named User',
      type: 'string',
      required: false,
      default: {
        '@path': '$.userId'
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
    occurred: {
      label: 'Occurred',
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
      label: 'Batch Data to Airship',
      description: 'If true, Segment will batch events before sending to Airship. Limit 100 events per request.',
      default: false
    }
  },
  perform: (request, { settings, payload }) => {
    return setCustomEvent(request, settings, payload)
  },
  performBatch: (request, { settings, payload }) => {
    return setBatchCustomEvent(request, settings, payload)
  }
}

export default action

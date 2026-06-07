import type { ActionDefinition } from '@segment/actions-core'
import type { Payload } from './generated-types'
import type { Settings } from '../generated-types'
import { setCustomEvent, setBatchCustomEvent } from '../utilities'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Custom Events',
  description: 'Set Custom Events on Users',
  defaultSubscription: 'type = "track"',
  fields: {
    named_user_id: {
      label: 'Airship Named User ID',
      description: 'The identifier assigned in Airship as the Named User. Provide either this or Channel ID.',
      type: 'string',
      required: false,
      default: {
        '@path': '$.userId'
      }
    },
    channel_id: {
      label: 'Channel ID',
      description: 'Airship Channel ID. Provide either this or Named User ID.',
      type: 'string',
      required: false
    },
    channel_type: {
      label: 'Channel Type',
      description: 'The Airship audience key for the channel type (e.g. android_channel, ios_channel, amazon_channel, web_channel). If omitted, the generic channel key is used and Airship will resolve the type, which may introduce a slight delay.',
      type: 'string',
      required: false
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

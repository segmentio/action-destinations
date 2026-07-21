import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import BaseRequestInterface from '../common/baseRequestInterface'
import { sanitize } from '../common/transforms'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Send an event to Nudge',
  defaultSubscription: 'type = "track"',
  fields: {
    name: {
      label: 'Event Name',
      type: 'string',
      description: 'The name of the action being performed.',
      required: true,
      default: { '@path': '$.event' }
    },
    ext_id: {
      label: 'User ID',
      type: 'string',
      description: 'The ID of the user performing the action.',
      required: true,
      default: { '@path': '$.userId' }
    },
    occurred_at: {
      label: 'Event Timestamp',
      type: 'datetime',
      description: 'The time at which the event occurred',
      required: true,
      default: {
        '@path': '$.timestamp'
      }
    },
    props: {
      label: 'Properties',
      type: 'object',
      description: 'Properties of the event',
      required: false,
      default: {
        '@path': '$.properties'
      }
    }
  },

  perform: async (request, { settings, payload }) => {
    payload.ext_id = sanitize(payload.ext_id)
    payload.name = sanitize(payload.name)

    return BaseRequestInterface.track(request, settings, payload)
  },

  performBatch: async (request, { settings, payload }) => {
    payload.forEach((it) => {
      it.ext_id = sanitize(it.ext_id)
      it.name = sanitize(it.name)
    })

    return BaseRequestInterface.batchTrack(request, settings, payload)
  }
}

export default action
